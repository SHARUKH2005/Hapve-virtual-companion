## Unified AI Avatar Platform (Final, End-to-End)

This repo already contains many sub-projects. The **end-to-end runnable “final project”** is:

- **Backend**: `virtual-companion-ai/avatar-service` (FastAPI + job system + modes FAST/PRO/ULTRA)
- **Frontend**: `virtual-companion-ai/frontend` (Vite + 3D preview + mode/quality selector)
- **Redis (optional but recommended)**: via `virtual-companion-ai/docker-compose.yml`

### Run (Windows)

From the repo root:

```powershell
cd virtual-companion-ai
.\start.ps1
```

Then open:
- Frontend: `http://localhost:3006`
- Backend docs: `http://localhost:8000/api/docs`

### Optional: Enable PRO/ULTRA (AirLLM)

Only if you want AirLLM modes locally:

```powershell
cd virtual-companion-ai/avatar-service
pip install -r requirements_airllm.txt
```

### Avatar Generation API

You can use either naming convention:

#### Hapve routes
- **Create job**: `POST /api/upload` (multipart)
  - fields: `file`, `style`, `mode` (`fast|pro|ultra`), `quality` (`medium|high|ultra`), optional `user_address`, `consent_given`
- **Job status**: `GET /api/job/{job_id}`

#### Unified routes (from your integration plan)
- **Create job**: `POST /avatars/create` (multipart)
- **Job status**: `GET /avatars/status/{job_id}`

### What “end-to-end” means right now

- **FAST mode** always works and returns a GLB preview URL (ReadyPlayerMe demo).
- **PRO/ULTRA** call the AirLLM service scaffold; if your heavy 3D pipeline produces a `.glb`, the worker will copy it to:
  - `virtual-companion-ai/avatar-service/static/{job_id}/avatar.glb`
  - and set `preview_url` to **`/static/{job_id}/avatar.glb`** so the frontend can load it over HTTP.

### Next optional step (for true photoreal PRO/ULTRA)

To make PRO/ULTRA produce real GLBs on your machine, you need to wire and configure:
- PIFuHD + Blender in `avatar-pipeline` (paths, models, dependencies)
- CUDA-capable PyTorch + AirLLM model download (70B is heavy)


