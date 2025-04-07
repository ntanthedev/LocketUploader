import axios from "axios";
import constants from "./constants";
import * as miscFuncs from "~/helper/misc-functions";

export const login = async (email, password, onPleaseWait) => {
    const timeOutId = setTimeout(() => {
        onPleaseWait();
    }, 5000);

    try {
        const res = await axios.post(constants.apiRoutes.LOGIN_URL, {
            email,
            password,
        });

        clearTimeout(timeOutId);
        return res.data;
    } catch (error) {
        clearTimeout(timeOutId);
        console.error("Login error:", error?.response?.data || error.message);
        return null;
    }
};

export const uploadMedia = async (file, caption, onPleaseWait) => {
    let timeOutId;
    try {
        const user = JSON.parse(miscFuncs.getCookie("user"));
        if (!user) {
            throw new Error("User not logged in");
        }
        
        const formData = new FormData();

        if (file.type.includes("image")) {
            formData.append("images", file);
            timeOutId = setTimeout(() => {
                onPleaseWait();
            }, 5000);
        } else if (file.type.includes("video")) {
            formData.append("videos", file);
            timeOutId = setTimeout(() => {
                onPleaseWait();
            }, 10000);
        } else {
            throw new Error("Unsupported file type");
        }

        formData.append("caption", caption);
        formData.append("userId", user.localId);
        formData.append("idToken", user.idToken);

        const res = await axios.post(
            constants.apiRoutes.UPLOAD_MEDIA_URL,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                timeout: 60000 // 60 giây timeout
            },
        );

        clearTimeout(timeOutId);
        return res.data;
    } catch (error) {
        if (timeOutId) {
            clearTimeout(timeOutId);
        }
        console.error("Upload error:", error?.response?.data || error.message);
        throw error;
    }
};
