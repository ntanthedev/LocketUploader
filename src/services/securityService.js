import CryptoJS from "crypto-js";

// Fallback key nếu không có biến môi trường
const DEFAULT_SECRET_KEY = "locket-secret-key-123";

export const encryptLoginData = (email, password) => {
    const secretKey = process.env.REACT_APP_HASH_SECRET_KEY || DEFAULT_SECRET_KEY;
    
    try {
        const encryptedEmail = CryptoJS.AES.encrypt(email, secretKey).toString();
        const encryptedPassword = CryptoJS.AES.encrypt(
            password,
            secretKey,
        ).toString();

        return { encryptedEmail, encryptedPassword };
    } catch (error) {
        console.error("Error encrypting login data:", error);
        // Fallback nếu mã hóa thất bại, trả về dữ liệu gốc
        return { encryptedEmail: email, encryptedPassword: password };
    }
};

export const decryptLoginData = (encryptedEmail, encryptedPassword) => {
    const secretKey = process.env.REACT_APP_HASH_SECRET_KEY || DEFAULT_SECRET_KEY;
    
    try {
        const decryptedEmail = CryptoJS.AES.decrypt(
            encryptedEmail,
            secretKey,
        ).toString(CryptoJS.enc.Utf8);
        const decryptedPassword = CryptoJS.AES.decrypt(
            encryptedPassword,
            secretKey,
        ).toString(CryptoJS.enc.Utf8);

        return { decryptedEmail, decryptedPassword };
    } catch (error) {
        console.error("Error decrypting login data:", error);
        // Fallback nếu giải mã thất bại, trả về dữ liệu gốc
        return { decryptedEmail: encryptedEmail, decryptedPassword: encryptedPassword };
    }
};
