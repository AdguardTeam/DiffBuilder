import path from 'path';
import os from 'os';

/**
 * Generates a random string of specified length.
 *
 * @param length The length of the random string.
 *
 * @returns A random string of specified length.
 */
const generateRandomString = (length = 16): string => {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i += 1) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

/**
 * Generates unique temporary file paths for old and new files.
 *
 * @returns Object containing paths for temporary old and new files.
 */
export const getTempFilePaths = (): { oldFilePath: string, newFilePath: string } => {
    const uniqueId = generateRandomString();

    return {
        oldFilePath: path.join(os.tmpdir(), `old_filter_${uniqueId}.txt`),
        newFilePath: path.join(os.tmpdir(), `new_filter_${uniqueId}.txt`),
    };
};
