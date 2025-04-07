import { createContext, useEffect, useState, useMemo, useCallback } from "react";

import PropTypes from "prop-types";
import * as miscFuncs from "~/helper/misc-functions";
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        try {
            const userData = miscFuncs.getCookie("user");
            if (userData) {
                setUser(JSON.parse(userData));
            }
        } catch (error) {
            console.error("Error parsing user data from cookie:", error);
            // Xóa cookie nếu dữ liệu không hợp lệ
            miscFuncs.deleteCookie("user");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateUser = useCallback((userData) => {
        setUser(userData);
        if (userData) {
            miscFuncs.setCookie("user", JSON.stringify(userData), 1);
        } else {
            miscFuncs.deleteCookie("user");
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        miscFuncs.deleteCookie("user");
    }, []);

    const contextValue = useMemo(
        () => ({ 
            user, 
            setUser: updateUser, 
            logout,
            isLoading 
        }),
        [user, updateUser, logout, isLoading],
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
