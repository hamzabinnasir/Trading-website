import Axios from "axios";

import authHeader from "./auth-header";

const API_URL = "https://trading-website-tan.vercel.app/api/";

class AccessRequestService {
    submitRequest(name, email, reason, username, password, fundPassword) {
        return Axios.post(API_URL + "access-request", {
            name,
            email,
            reason,
            username,
            password,
            fundPassword
        });
    }

    getAllRequests() {
        return Axios.get(API_URL + "admin/access-requests", { headers: authHeader() });
    }

    updateRequestStatus(id, status) {
        return Axios.patch(API_URL + "admin/access-requests/" + id, {
            status
        }, { headers: authHeader() });
    }
}

export default new AccessRequestService();
