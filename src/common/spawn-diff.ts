import { spawn } from 'child_process';
import { getErrorMessage } from './get-error-message';

/**
 * Executes the diff command with RCS format between two files.
 *
 * @param oldFilePath Path to the old file.
 * @param newFilePath Path to the new file.
 *
 * @returns A promise that resolves with the output of the diff command.
 */
export const spawnDiff = (oldFilePath: string, newFilePath: string): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        // '-n' option is used to build a patch in RCS format
        const diffProcess = spawn('diff', ['-n', oldFilePath, newFilePath]);

        // Set encoding for stdout and stderr to 'utf-8'
        diffProcess.stdout.setEncoding('utf-8');
        diffProcess.stderr.setEncoding('utf-8');

        let output = '';
        let errorOutput = '';

        diffProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        diffProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        diffProcess.on('close', (code) => {
            if (code === 0 || code === 1) {
                // Code 0 - files are identical, 1 - there are differences (both are considered successful)
                resolve(output);
            } else {
                reject(new Error(`diff failed with code ${code}: ${errorOutput.trim()}`));
            }
        });

        diffProcess.on('error', (err) => {
            reject(new Error(`Failed to start diff: ${getErrorMessage(err)}`));
        });
    });
};
