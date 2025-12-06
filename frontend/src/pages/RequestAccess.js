import React, { useState } from "react";
import { Link } from "react-router-dom";
import AccessRequestService from "../services/accessRequest.service";
import "./RequestAccess.css";

const RequestAccess = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        reason: ""
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        setLoading(true);

        AccessRequestService.submitRequest(formData.name, formData.email, formData.reason)
            .then(response => {
                setMessage(response.data.message);
                setLoading(false);
                setFormData({ name: "", email: "", reason: "" });
            })
            .catch(error => {
                const resMessage =
                    (error.response &&
                        error.response.data &&
                        error.response.data.message) ||
                    error.message ||
                    error.toString();

                setError(resMessage);
                setLoading(false);
            });
    };

    return (
        <div className="col-md-12">
            <div className="card card-container">
                <img
                    src="//ssl.gstatic.com/accounts/ui/avatar_2x.png"
                    alt="profile-img"
                    className="profile-img-card"
                />

                <h3 className="text-center mb-4">Request Access</h3>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            className="form-control"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reason">Reason for Access</label>
                        <textarea
                            className="form-control"
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            required
                            rows="3"
                        />
                    </div>

                    <div className="form-group mt-3">
                        <button className="btn btn-primary btn-block" disabled={loading}>
                            {loading && (
                                <span className="spinner-border spinner-border-sm"></span>
                            )}
                            <span>Submit Request</span>
                        </button>
                    </div>

                    {message && (
                        <div className="form-group">
                            <div className="alert alert-success" role="alert">
                                {message}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="form-group">
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        </div>
                    )}
                </form>

                <div className="text-center mt-3">
                    <Link to="/login">Already have an account? Login</Link>
                </div>
            </div>
        </div>
    );
};

export default RequestAccess;
