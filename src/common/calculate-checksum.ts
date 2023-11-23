import { createHash } from 'crypto';

/**
 * Calculates SHA1 checksum for patch.
 *
 * @param content Content to hash.
 *
 * @returns SHA1 checksum for patch.
 */
export const calculateChecksum = (content: string): string => {
    const hash = createHash('sha1');
    const data = hash.update(content, 'utf-8');

    return data.digest('hex');
};
