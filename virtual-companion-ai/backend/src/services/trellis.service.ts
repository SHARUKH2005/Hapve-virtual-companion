import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export class TrellisService {
    // Attempt to locate the specific venv python, otherwise fall back to system python
    private static getPythonPath(): string {
        const venvPath = path.resolve(__dirname, '../../../../avatar-pipeline/venv/Scripts/python.exe');
        if (fs.existsSync(venvPath)) {
            return venvPath;
        }
        return 'python'; // Fallback
    }

    static async generateAvatar(imagePath: string, outputFilename: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const pythonPath = this.getPythonPath();
            const scriptPath = path.resolve(__dirname, '../../scripts/generate_avatar.py');
            const outputDir = path.resolve(__dirname, '../../public/models/generated');

            // Ensure output dir exists
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const outputPath = path.join(outputDir, outputFilename);

            console.log(`[Trellis] Starting generation...`);
            console.log(`[Trellis] Input: ${imagePath}`);
            console.log(`[Trellis] Output: ${outputPath}`);
            console.log(`[Trellis] Using Python: ${pythonPath}`);

            const process = spawn(pythonPath, [
                scriptPath,
                '--input', imagePath,
                '--output', outputPath
            ]);

            let stdoutData = '';
            let stderrData = '';

            process.stdout.on('data', (data) => {
                const lines = data.toString();
                stdoutData += lines;
                console.log(`[Trellis Log]: ${lines}`);
            });

            process.stderr.on('data', (data) => {
                stderrData += data.toString();
                console.error(`[Trellis Error]: ${data.toString()}`);
            });

            process.on('close', (code) => {
                if (code === 0) {
                    console.log(`[Trellis] Generation successful!`);
                    // Return relative path for frontend serving
                    resolve(`/models/generated/${outputFilename}`);
                } else {
                    console.error(`[Trellis] Failed with code ${code}`);
                    reject(new Error(`Trellis generation failed: ${stderrData}`));
                }
            });
        });
    }
}
