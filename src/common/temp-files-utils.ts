import fs from 'fs';
import { getErrorMessage } from './get-error-message';

/**
 * Writes content to temporary files.
 *
 * @param params Parameters for writing to temporary files.
 * @param params.oldFilePath Path to the old temporary file.
 * @param params.oldContent Content to write to the old file.
 * @param params.newFilePath Path to the new temporary file.
 * @param params.newContent Content to write to the new file.
 *
 * @returns Promise that resolves when both files are written.
 */
export const writeToTempFiles = async ({
    oldFilePath,
    oldContent,
    newFilePath,
    newContent,
}: {
    oldFilePath: string;
    newFilePath: string;
    oldContent: string;
    newContent: string;
}): Promise<void> => {
    await Promise.all([
        fs.promises.writeFile(oldFilePath, oldContent),
        fs.promises.writeFile(newFilePath, newContent),
    ]);
};

/**
 * Deletes temporary files.
 *
 * @param oldFilePath Path to the old temporary file to delete.
 * @param newFilePath Path to the new temporary file to delete.
 * @param logger Optional logging function to log warnings if deletion fails.
 *
 * @returns Promise that resolves when both files are deleted (or attempted to delete).
 */
export const deleteTempFiles = async (
    oldFilePath: string,
    newFilePath: string,
    logger?: (message: string) => void,
): Promise<void> => {
    await Promise.all([
        fs.promises.unlink(oldFilePath).catch((e) => {
            if (logger) {
                logger(`Warning: Failed to delete temporary file ${oldFilePath}: ${getErrorMessage(e)}`);
            }
        }),
        fs.promises.unlink(newFilePath).catch((e) => {
            if (logger) {
                logger(`Warning: Failed to delete temporary file ${newFilePath}: ${getErrorMessage(e)}`);
            }
        }),
    ]);
};
