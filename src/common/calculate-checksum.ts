import SHA1 from 'crypto-js/sha1';

/**
 * Calculates SHA1 checksum for patch.
 *
 * @param content Content to hash.
 *
 * @returns SHA1 checksum for patch.
 */
export const calculateChecksum = (content: string): string => {
    const res = SHA1(content);

    return res.toString();
};
