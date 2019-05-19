import React, { Component } from 'react';
import { reduxForm, Field } from 'redux-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Row, Col, Container, Form, Card, Button, Alert, Image } from 'react-bootstrap';
import ReCAPTCHA from "react-google-recaptcha";
import * as actions from '../../actions';
import { ROOT_PATH, LOGIN_SCREEN_TXT, LOGIN_IMAGE, RECAPTCHA_SITE_KEY } from '../../client_config';

class Login extends Component {
 
  constructor (props) {
    super(props);

    this.state = {
      reCaptcha: null,
      stdUsers: true
    };
  }

  componentWillUnmount() {
    this.props.leaveLoginForm();
  }

  onCaptchaChange(token) {
    this.setState({reCaptcha: token});
  }

  renderTextField({ input, label, placeholder, type="text", required, meta: { touched, error } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : '';
    let placeholder_txt = (placeholder)? placeholder: label;

    const labelComponent = (label)? <Form.Label>{label}{requiredField}</Form.Label> : null;

    return (
      <Form.Group as={Col} lg="12">
        {labelComponent}
        <Form.Control type={type} {...input} placeholder={placeholder_txt} isInvalid={touched && error}/>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    );
  }

  handleFormSubmit({ username, password }) {
    username = username.toLowerCase();
    let reCaptcha = this.state.reCaptcha;
    this.props.login({username, password, reCaptcha});
  }

  renderAlert(){
    if(this.props.errorMessage) {
      return (
        <Alert variant="danger">
          <strong>Opps!</strong> {this.props.errorMessage}
        </Alert>
      );
    } else if (this.props.successMessage) {
      return (
        <Alert variant="success">
          <strong>Sweet!</strong> {this.props.successMessage}
        </Alert>
      );
    }
  }
 
  render() {
    const { handleSubmit, pristine, reset, submitting, valid } = this.props;
    const loginCardHeader = (<h5 className="form-signin-heading">Please Sign In</h5>);

    const recaptcha = ( RECAPTCHA_SITE_KEY !== "")? (
      <span>
        <ReCAPTCHA
          ref={e => reCaptchaInstance = e}
          sitekey={RECAPTCHA_SITE_KEY}
          theme="dark"
          size="normal"
          onChange={this.onCaptchaChange.bind(this)}
        />
        <br/>
      </span>
    ): null;

    const loginButton = ( RECAPTCHA_SITE_KEY === "")? <Button variant="primary" type="submit" block disabled={submitting || !valid}>Login</Button> : <Button variant="primary" type="submit" block disabled={submitting || !valid || !this.state.reCaptcha}>Login</Button>;

    const loginAsGuestButton = ( RECAPTCHA_SITE_KEY === "")? <Button variant="success" onClick={() => this.props.switch2Guest()} block>Login as Guest</Button> : <Button variant="success" onClick={() => this.props.switch2Guest(this.state.reCaptcha)} block disabled={!this.state.reCaptcha}>Login as Guest</Button>;

    return (
      <Container>
        <Row>
          <Col sm={12} md={6} lg={{span:5, offset:1}}>
            <Card className="form-signin">
              <Card.Body>
                {loginCardHeader}
                <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
                  <Form.Group>
                    <Field
                      name="username"
                      component={this.renderTextField}
                      placeholder="Username"
                    />
                    <Field
                      name="password"
                      component={this.renderTextField}
                      type="password"
                      placeholder="Password"
                    />
                  </Form.Group>
                  {recaptcha}
                  {this.renderAlert()}
                  {loginButton}
                  {loginAsGuestButton}
                </Form>
                <br/>
                <div>
                  <span>
                    <Link to={ `/forgotPassword` }>{<FontAwesomeIcon icon="arrow-left"/>} Forgot Password?</Link>
                  </span>
                  <span className="float-right">
                    <Link to={ `/register` }>Register New User {<FontAwesomeIcon icon="arrow-right"/>}</Link>
                  </span>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6} lg={5}>
            <div className="form-signin">
              <div className="d-flex justify-content-center">
                <Image style={{width:"250px", margin: "0 auto"}} fluid src={`${ROOT_PATH}images/${LOGIN_IMAGE}`} />
              </div>
              <br/><br/>
              <div style={{padding: "0px 16px 0px 16px"}}>{LOGIN_SCREEN_TXT}</div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
}

// <ReCAPTCHA
// ref={e => reCaptchaInstance = e}
// sitekey={RECAPTCHA_SITE_KEY}
// theme="dark"
// size="normal"
// onChange={this.onCaptchaChange.bind(this)}
// />
// <br/>

// <Button variant="primary" type="submit" block disabled={submitting || !valid || !this.state.reCaptcha}>Login</Button>


const validate = values => {

  const errors = {};
  if (!values.username) {
    errors.username = 'Required';
  }

  if (!values.password) {
    errors.password = 'Required';
  }

  return errors;
};

let reCaptchaInstance = null;

const afterSubmit = (result, dispatch) => {
//  reCaptchaInstance.reset();
};

function mapStateToProps(state) {
  return {
    errorMessage: state.auth.error,
    successMessage: state.auth.message
  };
}

Login = reduxForm({
  form: 'login',
  validate: validate,
  onSubmitSuccess: afterSubmit
})(Login);

export default connect(mapStateToProps, actions)(Login);
