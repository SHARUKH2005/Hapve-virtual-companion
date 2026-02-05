"""
AirLLM‑powered avatar generation service (scaffold).

This module provides a unified interface for the three avatar generation modes:
    - FAST:  quick / cloud or placeholder (no heavy GPU)
    - PRO:   AirLLM‑guided high‑quality generation
    - ULTRA: highest‑quality / longest running jobs

For now, the heavy 3D reconstruction and mesh/texturing steps are intentionally
kept abstract so they can be wired either to the existing `avatar-pipeline`
project or to a future PIFuHD / RodinHD integration. The goal is to centralize
mode selection, hardware‑aware AirLLM loading, and logging.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, Optional, Dict, Any

from gpu_config import GPUConfig

logger = logging.getLogger(__name__)

Mode = Literal["fast", "pro", "ultra"]
Quality = Literal["medium", "high", "ultra"]


try:
    # AirLLM is optional; if it's not installed we gracefully degrade
    from airllm import AirLLMLlama2  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    AirLLMLlama2 = None  # type: ignore


@dataclass
class AvatarGenerationResult:
    """Lightweight result container for avatar generation."""

    glb_path: Optional[str]
    mode: Mode
    quality: Quality
    stats: Dict[str, Any]


class AirLLMAvatarService:
    """
    Service wrapper around AirLLM + downstream 3D pipeline.

    In this codebase, it is used by the worker to implement PRO/ULTRA modes,
    while FAST mode can continue relying on Ready Player Me / placeholder GLB.
    """

    def __init__(self) -> None:
        self.hardware = GPUConfig.detect_hardware()
        self.config = GPUConfig.optimize_for_hardware()

        logger.info("AirLLMAvatarService hardware: %s", self.hardware)
        logger.info("AirLLMAvatarService config: %s", self.config)

        self._llm = None

    @property
    def llm(self):
        """Lazy‑load AirLLM with hardware‑aware settings."""
        if self._llm is not None:
            return self._llm

        if AirLLMLlama2 is None:
            logger.warning("AirLLM not installed; falling back to non‑LLM pipeline.")
            return None

        logger.info("Loading AirLLM Platypus2‑70B (may take several minutes)...")
        self._llm = AirLLMLlama2(
            model_path="garage-bAInd/Platypus2-70B-instruct",
            compression=self.config.get("compression"),
            layer_shards=self.config.get("layer_shards", 8),
        )
        logger.info("AirLLM model loaded.")
        return self._llm

    async def generate_avatar(
        self,
        job_id: str,
        photo_path: str,
        mode: Mode = "pro",
        quality: Quality = "high",
        output_root: Optional[str] = None,
    ) -> AvatarGenerationResult:
        """
        Unified entrypoint for AirLLM‑powered avatar generation.

        This is intentionally high‑level; it can be wired to:
        - the existing `avatar-pipeline` (PIFuHD + Blender),
        - a future RodinHD / TRELLIS pipeline,
        - or any other 3D reconstruction backend.
        """

        logger.info(
            "Starting AirLLM avatar generation job_id=%s mode=%s quality=%s",
            job_id,
            mode,
            quality,
        )

        # Determine output root
        base_output = Path(output_root) if output_root else Path("generated_avatars")
        base_output.mkdir(parents=True, exist_ok=True)
        job_dir = base_output / job_id
        job_dir.mkdir(parents=True, exist_ok=True)

        # For now, we do a minimal scaffold:
        #   - Optionally run AirLLM analysis (no hard dependency).
        #   - Delegate 3D reconstruction to an external pipeline if available.
        #   - Otherwise, we simply record a placeholder GLB path.

        analysis = None
        if self.llm is not None:
            try:
                analysis = await self._analyze_photo(photo_path)
            except Exception as e:  # pragma: no cover - environment specific
                logger.warning("AirLLM analysis failed, continuing without it: %s", e)

        glb_path = await self._run_3d_pipeline(job_id, photo_path, job_dir, mode, quality, analysis)

        stats: Dict[str, Any] = {
            "hardware": self.hardware,
            "mode": mode,
            "quality": quality,
            "analysis_used": analysis is not None,
        }

        if glb_path and os.path.exists(glb_path):
            try:
                size_mb = os.path.getsize(glb_path) / (1024 * 1024)
            except Exception:
                size_mb = None
            stats["file_size_mb"] = size_mb

        return AvatarGenerationResult(
            glb_path=glb_path,
            mode=mode,
            quality=quality,
            stats=stats,
        )

    async def _analyze_photo(self, photo_path: str) -> Optional[str]:
        """
        Use AirLLM to analyze portrait characteristics and recommend 3D parameters.

        This is kept intentionally simple; in a production setup you would:
        - Combine with a vision encoder,
        - Parse JSON output,
        - Feed structured hints into PIFuHD / RodinHD.
        """
        if self.llm is None:
            return None

        prompt = f"""
        You are assisting with 3D avatar generation from a single portrait photo.
        The input image is located at: {photo_path}

        Provide a concise JSON object (no prose) describing:
        - face_shape: one of ["oval","round","square","heart"]
        - lighting: short description
        - recommended_mesh_density: "low" | "medium" | "high"
        - notes: up to 2 short bullet‑style strings
        """
        logger.info("Running AirLLM photo analysis...")
        # `generate` signature depends on airllm version; keep it generic.
        raw = await self.llm.generate(prompt)  # type: ignore[func-returns-value]
        return str(raw)

    async def _run_3d_pipeline(
        self,
        job_id: str,
        photo_path: str,
        job_dir: Path,
        mode: Mode,
        quality: Quality,
        analysis: Optional[str],
    ) -> Optional[str]:
        """
        Hook to connect with the actual 3D reconstruction pipeline.

        Implementation strategy:
        - If `avatar-pipeline/backend` is available, we can import and call its
          `run_full_pipeline` function.
        - Otherwise, we just return a placeholder path so that the rest of the
          Hapve + Virtual Companion stack still works end‑to‑end.
        """
        # Try to integrate with the sibling `avatar-pipeline` project if present.
        try:
            from importlib import import_module
            import sys

            root = Path(__file__).resolve().parents[2]  # project root `face/`
            avatar_backend = root / "avatar-pipeline" / "backend"

            if avatar_backend.exists():
                sys.path.append(str(avatar_backend))
                process_job = import_module("process_job")
                run_full_pipeline = getattr(process_job, "run_full_pipeline", None)
                if callable(run_full_pipeline):
                    logger.info("Delegating 3D generation to avatar-pipeline backend...")
                    glb_url = run_full_pipeline(job_id, photo_path, str(job_dir))
                    # The legacy pipeline returns a URL (e.g. /static/...); map to path if possible.
                    # For now we just store the local path we expect.
                    expected_glb = next(job_dir.glob("*.glb"), None)
                    return str(expected_glb) if expected_glb else None
        except Exception as e:
            logger.warning("Failed to call external avatar-pipeline: %s", e)

        # Fallback: no 3D pipeline available. Just return None; caller can use a demo GLB.
        logger.info("No external 3D pipeline wired; using placeholder GLB.")
        return None


