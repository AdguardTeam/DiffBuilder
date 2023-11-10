import { createHash } from 'crypto';

/**
 * Calculates SHA1 checksum for patch.
 *
 * @param patchContent Content of the patch.
 *
 * @returns SHA1 checksum for patch.
 */
export const calculateChecksum = (patchContent: string): string => {
    const hash = createHash('sha1');
    const data = hash.update(patchContent, 'utf-8');

    return data.digest('hex');
};
