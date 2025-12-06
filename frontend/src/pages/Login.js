// frontend/src/pages/Login.js

import React, { Component } from "react";
import {
  Container,
  Row,
  Col,
  Image,
  Button,
  Navbar,
  Form,
  Nav,
  Alert,
  Modal
} from "react-bootstrap";
import { AuthService } from "../services";
import { Wave, Portfolio, Logo, Avatar } from "../img";

// component Login
export default class Login extends Component {
  /**
   * constructor of Login
   * @param {*} props
   */
  constructor(props) {
    super(props);

    this.handleLogin = this.handleLogin.bind(this);
    this.handleAdminLogin = this.handleAdminLogin.bind(this);
    this.onChangeUsername = this.onChangeUsername.bind(this);
    this.onChangePassword = this.onChangePassword.bind(this);
    this.onChangeInvitationCode = this.onChangeInvitationCode.bind(this);
    this.onChangeAdminUsername = this.onChangeAdminUsername.bind(this);
    this.onChangeAdminPassword = this.onChangeAdminPassword.bind(this);
    this.handleShowAdminModal = this.handleShowAdminModal.bind(this);
    this.handleCloseAdminModal = this.handleCloseAdminModal.bind(this);

    this.state = {
      username: "",
      password: "",
      invitationCode: "",
      adminUsername: "",
      adminPassword: "",
      loading: false,
      adminLoading: false,
      message: "",
      adminMessage: "",
      userInvalid: false,
      pwInvalid: false,
      currentUser: AuthService.getCurrentUser(),
      showAdminModal: false,
      requiresInvitation: false
    };
  }

  /**
   * handles change in username-input
   * @param {Event} e
   */
  onChangeUsername(e) {
    this.setState({
      message: "",
      username: e.target.value,
      userInvalid: false,
    });
  }

  /**
   * handles change in password-input
   * @param {Event} e
   */
  onChangePassword(e) {
    this.setState({
      message: "",
      password: e.target.value,
      pwInvalid: false,
    });
  }

  onChangeInvitationCode(e) {
    this.setState({
      invitationCode: e.target.value,
      message: ""
    });
  }

  /**
   * handles change in admin username-input
   * @param {Event} e
   */
  onChangeAdminUsername(e) {
    this.setState({
      adminMessage: "",
      adminUsername: e.target.value,
    });
  }

  /**
   * handles change in admin password-input
   * @param {Event} e
   */
  onChangeAdminPassword(e) {
    this.setState({
      adminMessage: "",
      adminPassword: e.target.value,
    });
  }

  /**
   * handles admin login modal show
   */
  handleShowAdminModal() {
    this.setState({
      showAdminModal: true,
      adminMessage: ""
    });
  }

  /**
   * handles admin login modal close
   */
  handleCloseAdminModal() {
    this.setState({
      showAdminModal: false,
      adminUsername: "",
      adminPassword: "",
      adminMessage: ""
    });
  }

  /**
   * handles login
   * @param {Event} e
   */
  handleLogin(e) {
    e.preventDefault();
    localStorage.clear();
    sessionStorage.clear();
    console.log("✅ All storage cleared before login");
    this.setState({
      loading: true,
      message: "",
    });

    if (this.state.username === "" || this.state.password === "") {
      this.setState({
        userInvalid: !this.state.username,
        pwInvalid: !this.state.password,
        loading: false,
      });
      return;
    }

    AuthService.login(this.state.username, this.state.password, this.state.invitationCode).then(
      (response) => {
        console.log("✅ Login successful, checking storage...");

        // ✅ Verify the correct user is stored
        const currentUser = AuthService.getCurrentUser();
        console.log("🔍 Current user after login:", currentUser);

        if (currentUser && currentUser.username === this.state.username) {
          console.log("✅ Correct user stored, redirecting...");
          this.props.history.push("/dashboard");
          window.location.reload(); // Force refresh to clear any cached data
        } else {
          console.error("❌ User storage mismatch!");
          this.setState({
            loading: false,
            message: "Login failed - storage error"
          });
        }
      },
      (error) => {
        let resMessage =
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          error.message ||
          error.toString();

        // ✅ FIX: Ensure resMessage is a string, not an object
        if (typeof resMessage === 'object') {
          resMessage = JSON.stringify(resMessage);
        }

        const requiresInvitation = error.response && error.response.data && error.response.data.requiresInvitation;

        this.setState({
          userInvalid: true,
          pwInvalid: true,
          loading: false,
          message: resMessage,
          requiresInvitation: requiresInvitation
        });
      }
    );
  }

  /**
   * handles admin login
   * @param {Event} e
   */
  handleAdminLogin(e) {
    e.preventDefault();

    this.setState({
      adminLoading: true,
      adminMessage: "",
    });

    if (this.state.adminUsername === "" || this.state.adminPassword === "") {
      this.setState({
        adminLoading: false,
        adminMessage: "Please enter both username and password",
      });
      return;
    }

    AuthService.adminLogin(this.state.adminUsername, this.state.adminPassword)
      .then((data) => {
        console.log('✅ Admin login successful, checking storage...');

        // ✅ Verify the correct admin is stored
        const currentUser = AuthService.getCurrentUser();
        console.log('🔍 Current user after admin login:', currentUser);

        if (currentUser && currentUser.username === this.state.adminUsername) {
          console.log('✅ Correct admin stored, redirecting...');
          this.setState({
            adminLoading: false,
            showAdminModal: false
          });

          this.props.history.push('/admin/dashboard');
          window.location.reload(); // Force refresh
        } else {
          console.error('❌ Admin storage mismatch!');
          this.setState({
            adminLoading: false,
            adminMessage: 'Admin login failed - storage error'
          });
        }
      })
      .catch(error => {
        console.error('❌ Admin login error:', error);
        this.setState({
          adminLoading: false,
          adminMessage: error.message || 'Admin login failed.'
        });
      });
  }

  /**
   * render-function of Login
   */
  render() {
    const { currentUser } = this.state;

    if (currentUser != null) {
      this.props.history.push("/dashboard");
      window.location.reload();
    }

    return (
      <Container fluid>
        <Image src={Wave} className="position-fixed h-100"></Image>

        <Navbar className="z-100">
          <Navbar.Brand href="./">
            <img src={Logo} alt="PaperCoin" />
          </Navbar.Brand>
        </Navbar>

        <Row className="main-content">
          <Col className="d-flex">
            <Image
              src={Portfolio}
              className="mx-auto my-auto h-60"
              fluid
            ></Image>
          </Col>
          <Col className="d-flex">
            <div className="mx-auto my-auto w-75 d-inline jumbotron">
              <div className="d-flex justify-content-center mb-3">
                <Image src={Avatar} className="w-25"></Image>
              </div>
              <h1 className="text-center text-dark">Welcome</h1>
              <Form className="text-center" onSubmit={this.handleLogin}>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="Username"
                    onChange={this.onChangeUsername}
                    isInvalid={this.state.userInvalid}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="password"
                    placeholder="Password"
                    onChange={this.onChangePassword}
                    isInvalid={this.state.pwInvalid}
                  />
                </Form.Group>

                {this.state.requiresInvitation && (
                  <Form.Group className="mb-3">
                    <Form.Control
                      type="text"
                      placeholder="Invitation Code"
                      onChange={this.onChangeInvitationCode}
                      isInvalid={!this.state.invitationCode && this.state.requiresInvitation}
                    />
                    <Form.Text className="text-muted">
                      Please enter the invitation code sent to your email.
                    </Form.Text>
                  </Form.Group>
                )}

                <Alert variant="danger" show={this.state.message}>
                  {this.state.message}
                </Alert>
                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 mb-1"
                  disabled={this.state.loading}
                >
                  {this.state.loading ? "Logging in..." : "Login"}
                </Button>

                {/* Admin Login Button below regular login */}
                <Button
                  variant="outline-secondary"
                  className="w-100 mb-3"
                  onClick={this.handleShowAdminModal}
                >
                  Login as Administrator
                </Button>

                <Nav className="justify-content-center">
                  <Nav.Item>
                    <Nav.Link href="./register">
                      Request Access
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Form>
            </div>
          </Col>
        </Row>

        {/* Admin Login Modal */}
        <Modal
          show={this.state.showAdminModal}
          onHide={this.handleCloseAdminModal}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Admin Login</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={this.handleAdminLogin}>
              <Form.Group className="mb-3">
                <Form.Label>Admin Username</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter admin username"
                  value={this.state.adminUsername}
                  onChange={this.onChangeAdminUsername}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Admin Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter admin password"
                  value={this.state.adminPassword}
                  onChange={this.onChangeAdminPassword}
                  required
                />
              </Form.Group>

              <Alert variant="danger" show={this.state.adminMessage}>
                {this.state.adminMessage}
              </Alert>

              <Button
                variant="primary"
                type="submit"
                className="w-100"
                disabled={this.state.adminLoading}
              >
                {this.state.adminLoading ? "Logging in..." : "Login as Admin"}
              </Button>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Add some CSS for the admin button */}
        <style>
          {`
            .admin-login-btn {
              border: 2px solid #007bff;
              color: #007bff;
              background: transparent;
              font-weight: 500;
              border-radius: 20px;
              transition: all 0.3s ease;
            }
            .admin-login-btn:hover {
              background: #007bff;
              color: white;
              transform: translateY(-1px);
            }
          `}
        </style>
      </Container>
    );
  }
}