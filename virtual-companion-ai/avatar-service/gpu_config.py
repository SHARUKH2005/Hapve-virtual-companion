"""
GPU and hardware detection utilities for AirLLM-powered avatar generation.

This is a lightweight adaptation of the configuration described in the
integration plan. It is safe to import even in CPU-only environments.
"""

from __future__ import annotations

import logging
from typing import Dict, Any

try:
    import torch  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    torch = None  # type: ignore

try:
    import psutil  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    psutil = None  # type: ignore

logger = logging.getLogger(__name__)


class GPUConfig:
    """Utility class to inspect available hardware and suggest AirLLM settings."""

    @staticmethod
    def detect_hardware() -> Dict[str, Any]:
        """Auto-detect available hardware (CPU / GPU + RAM / VRAM)."""

        ram_gb = None
        if psutil is not None:
            try:
                ram_gb = psutil.virtual_memory().total / (1024 ** 3)
            except Exception:
                ram_gb = None

        if torch is not None and getattr(torch, "cuda", None) and torch.cuda.is_available():  # type: ignore[attr-defined]
            try:
                gpu_name = torch.cuda.get_device_name(0)  # type: ignore[union-attr]
                vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)  # type: ignore[union-attr]
            except Exception as e:  # pragma: no cover - very env specific
                logger.warning("Failed to query CUDA device properties: %s", e)
                gpu_name = "Unknown CUDA GPU"
                vram_gb = 0

            return {
                "mode": "gpu",
                "gpu_name": gpu_name,
                "vram_gb": float(vram_gb),
                "ram_gb": float(ram_gb) if ram_gb is not None else None,
                "recommended_mode": "pro" if vram_gb >= 12 else "fast",
            }

        # CPU‑only fallback
        return {
            "mode": "cpu",
            "ram_gb": float(ram_gb) if ram_gb is not None else None,
            "recommended_mode": "fast",
            "warning": "GPU not available. Pro/Ultra modes will be very slow.",
        }

    @staticmethod
    def optimize_for_hardware() -> Dict[str, Any]:
        """
        Suggest AirLLM settings (compression, sharding, batch size) based on VRAM.

        These values mirror the integration guide and are intentionally conservative
        so they work across a wide range of setups.
        """
        hw = GPUConfig.detect_hardware()

        # CPU‑only: maximum compression, tiny batches
        if hw["mode"] == "cpu":
            return {
                "compression": "8bit",
                "layer_shards": 16,
                "batch_size": 1,
            }

        vram = float(hw.get("vram_gb") or 0)
        if vram < 12:
            return {
                "compression": "4bit",
                "layer_shards": 8,
                "batch_size": 1,
            }
        if vram < 24:
            return {
                "compression": "4bit",
                "layer_shards": 4,
                "batch_size": 2,
            }

        # High‑end GPUs (e.g. 4090, A6000, etc.)
        return {
            "compression": None,
            "layer_shards": 2,
            "batch_size": 4,
        }


