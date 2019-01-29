import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux';
import { reduxForm, Field } from 'redux-form';
import { Link } from 'react-router-dom';
import { Grid, Row, Col, FormGroup, Panel, Button, Alert } from 'react-bootstrap';
// import ReCAPTCHA from "react-google-recaptcha";
// import { RECAPTCHA_SITE_KEY } from '../../client_config';
import * as actions from '../../actions';

class Register extends Component {

  constructor (props) {
    super(props);

    this.state = { 
      reCaptcha: null
    }
  }

  componentWillUnmount() {
    this.props.leaveRegisterForm();
  }

  handleFormSubmit({username, fullname, email, password}) {
    let reCaptcha = this.state.reCaptcha

    this.props.registerUser({username, fullname, email, password, reCaptcha});
  }

  onCaptchaChange(token) {
    this.setState({reCaptcha: token})
  }


  renderField({ input, label, type, required, meta: { touched, error, warning } }) {

    let requiredField = (required)? (<span className='text-danger'> *</span>) : ''    

    return (
      <FormGroup>
        <label>{label}{requiredField}</label>
        <div>
          <input className="form-control" {...input} placeholder={label} type={type}/>
          {touched && ((error && <div className='text-danger'>{error}</div>) || (warning && <div className='text-danger'>{warning}</div>))}
        </div>
      </FormGroup>
    )
  }

  renderSuccess() {
    if (this.props.message) {
      const panelHeader = (<h4>New User Registration</h4>);

      return (
        <Panel className="form-signin" >
          <Panel.Body>
            {panelHeader}
            <div className="alert alert-success">
              <strong>Success!</strong> {this.props.message}
            </div>
            <div className="text-right">
              <Link to={ `/login` }>Proceed to Login {<FontAwesomeIcon icon="arrow-right"/>}</Link>
            </div>
          </Panel.Body>
        </Panel>
      )
    }
  }

  renderAlert() {
    if (this.props.errorMessage) {
      return (
        <div className="alert alert-danger">
          <strong>Opps!</strong> {this.props.errorMessage}
        </div>
      )
    }
  }

  renderForm() {

    if (!this.props.message) {

      const panelHeader = (<h4 className="form-signin-heading">New User Registration</h4>);
      const { handleSubmit, pristine, reset, submitting, valid } = this.props;
      //console.log(this.props);

      return (
        <Panel className="form-signin" >
          <Panel.Body>
            {panelHeader}
            <form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <FormGroup>
                <Field
                  name="username"
                  component={this.renderField}
                  type="text"
                  label="Username"
                  required={true}
                />
              </FormGroup>
              <FormGroup>
                <Field
                  name="fullname"
                  type="text"
                  component={this.renderField}
                  label="Full Name"
                  required={true}
                />
              </FormGroup>
              <FormGroup>
                <Field
                  name="email"
                  component={this.renderField}
                  type="text"
                  label="Email"
                  required={true}
                />
              </FormGroup>
              <FormGroup>
                <Field
                  name="password"
                  component={this.renderField}
                  type="password"
                  label="Password"
                  required={true}
                />
              </FormGroup>
              <FormGroup>
                <Field
                  name="confirmPassword"
                  component={this.renderField}
                  type="password"
                  label="Confirm Password"
                  required={true}
                />
              </FormGroup>
              <ReCAPTCHA
                ref={e => recaptchaInstance = e}
                sitekey={RECAPTCHA_SITE_KEY}
                theme="dark"
                size="normal"
                onChange={this.onCaptchaChange.bind(this)}
              />
              <br/>
              {this.renderAlert()}
              <Button bsStyle="primary" block type="submit" disabled={submitting || !valid}>Register</Button>
            </form>
            <br/>
            <div>
              <Link to={ `/login` }>{<FontAwesomeIcon icon="arrow-left"/>} Back to Login</Link>
            </div>
          </Panel.Body>
        </Panel>
      )
    }
  }

  render() {

    return(
      <Grid>
        <Row>
          <Col>
            {this.renderSuccess()}
            {this.renderForm()}
          </Col>
        </Row>
      </Grid>
    )
  }
}

function validate(formProps) {
  const errors = {};

  if (!formProps.username) {
    errors.username = 'Required'
  } else if (formProps.username.length > 15) {
    errors.username = 'Username must be 15 characters or less'
  } else if (formProps.username.match(/[ ]/)) {
    errors.username = 'Username can not include whitespace'
  } else if (formProps.username.match(/[A-Z]/)) {
    errors.username = 'Username can NOT include uppercase letters'
  }

  if (!formProps.fullname) {
    errors.fullname = 'Required'
  }

  if (!formProps.email) {
    errors.email = 'Required'
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(formProps.email)) {
    errors.email = 'Invalid email address'
  }

  if (!formProps.password) {
    errors.password = "Required";
  } else if (formProps.password.length < 8) {
    errors.password = 'Password must be 8 characters or more'
  } else if (formProps.password.match(/[ ]/)) {
    errors.password = 'Password can not include whitespace'
  }

  if(formProps.password !== formProps.confirmPassword) {
    errors.confirmPassword = "Passwords must match";
  }

  return errors;

}

function mapStateToProps(state) {
  return {
    errorMessage: state.user.register_error,
    message: state.user.register_message
  };

}

let recaptchaInstance = null;

const afterSubmit = (result, dispatch) => {
  recaptchaInstance.reset();
}

Register = reduxForm({
  form: 'register',
  validate: validate,
  onSubmitSuccess: afterSubmit
})(Register);

export default connect(mapStateToProps, actions)(Register);