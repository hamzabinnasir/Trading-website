// imports
import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { UserService, AuthService } from "../services";
// 1. AppHeader Import Kiya
import AppHeader from "../components/AppHeader";

// component About
export default class About extends React.Component {
  /**
   * constructor of About
   * @param {*} props
   */
  constructor(props) {
    super(props);

    this.state = {
      currentUser: AuthService.getCurrentUser(),
      message: "",
      currentUSD: 0,
    };
  }

  /**
   * executes on mount
   */
  componentDidMount() {
    this.getBalance();
  }

  /**
   * gets user balance from backend
   */
  getBalance() {
    UserService.getUserBalance(this.state.currentUser.username).then(
      (response) => {
        this.setState({
          currentUSD: response.balance.toFixed(2),
        });
      },
      (error) => {
        const resMessage =
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          error.message ||
          error.toString();
        this.setState({
          message: resMessage,
        });
      }
    );
  }

  // handleLogout function hata diya kyunki ab yeh AppHeader handle karega

  /**
   * render-function of About
   */
  render() {
    const { currentUser } = this.state;

    if (currentUser == null) {
      this.props.history.push("/login");
      window.location.reload();
    }

    return (
      <Container fluid>
        {/* 2. Purana Navbar replace kiya AppHeader se */}
        <AppHeader />

        <Row
          className="d-flex justify-content-center align-items-center"
          style={{
            height: "calc(100vh - 76px)",
            marginBottom: "0px",
            margin: "0",
            padding: "0",
          }}
        >
          <Col
            md="12"
            className="h-100 m-0 p-0 pb-2 pl-2 pr-2 d-flex justify-content-center align-items-center"
          >
            <div
              className="rounded w-70 h-100 pl-5 pr-5 bg-dark text-light text-center"
              style={{ border: "2px solid grey" }}
            >
              <h1 className="h-25 d-flex justify-content-center align-items-center">
                About
              </h1>
              <div className="h-75">
                The aim of this web application is to deliver an authentic
                cryptocurrency trading experience. We strive to enable our users
                to engage in a{" "}
                <b className="text-primary">
                  realistic and risk free trading environment
                </b>{" "}
                which is synced to the latest exchange rates.
                <br></br>
                <br></br>
                Please note that this is a{" "}
                <b className="text-primary">prototype</b>, which means certain
                processes are yet to be optimised. Nevertheless, we are proud to
                present a{" "}
                <b className="text-primary">
                  fully functional papertrading experience
                </b>{" "}
                with more than 10 supported currencies - and more to come.
                <br></br>
                <br></br>
                How it works: Users will receive their initial start-off funds
                of <b className="text-primary">10,000 dollars</b> right after
                registration. From thereon you are free to invest in our
                supported cryptocurrencies by selling or buying at your leisure.
                Strategic decisions are supported by our individual trading
                charts and exchange history. By practising with our simulation,
                you are able to gain vital knowledge and try out your own
                strategy first-hand, before even investing a cent of real money.
                <br></br>
                <br></br>
                If you face any difficulties with our web app, please do not
                hesitate to contact our lead developers directly:
                <br></br>
                <br></br>
                <b className="text-primary">Silas Pohl</b>,{" "}
                <b className="text-primary">Golo Mühr</b> and{" "}
                <b className="text-primary">Pius Walter</b>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
}