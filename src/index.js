import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import GlobalStyles from "./components/GlobalStyles/GlobalStyles";
import { AuthProvider } from "./contexts/AuthContext";

// Xử lý các lỗi không được bắt
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  // Có thể thêm code để hiển thị thông báo hoặc gửi log lỗi về server
});

// Xử lý khi mạng offline/online
window.addEventListener('online', () => {
  console.log('Kết nối mạng đã được khôi phục');
});

window.addEventListener('offline', () => {
  console.log('Mất kết nối mạng');
  // Có thể thêm code để hiển thị thông báo cho người dùng
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <AuthProvider>
        <GlobalStyles>
            <App />
        </GlobalStyles>
    </AuthProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
