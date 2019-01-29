import React, { Component } from 'react';
import { reduxForm, Field, reset } from 'redux-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Grid, Row, Col, FormGroup, Checkbox, Panel, Button, Alert, Image } from 'react-bootstrap';
// import ReCAPTCHA from "react-google-recaptcha";
import * as actions from '../../actions';
// import { ROOT_PATH, RECAPTCHA_SITE_KEY } from '../../client_config';
import { ROOT_PATH } from '../../client_config';

class ResetPassword extends Component {
 
 constructor (props) {
    super(props);

    // this.state = { 
    //   reCaptcha: null
    // }

    this.handleFormSubmit = this.handleFormSubmit.bind(this);
  }

  componentWillUnmount() {
    this.props.leaveLoginForm();
  }

  handleFormSubmit({ password }) {
    // let reCaptcha = this.state.reCaptcha
    let token = this.props.match.params.token
    // this.props.resetPassword({token, password, reCaptcha});
    this.props.resetPassword({token, password});
  }

  // onCaptchaChange(token) {
  //   this.setState({reCaptcha: token})
  // }

  renderSuccess() {

    if (this.props.successMessage) {
      const panelHeader = (<h4 className="form-signin-heading">Reset Password</h4>);

      return (
        <Panel className="form-signin" >
          <Panel.Body>
            {panelHeader}
            <div className="alert alert-success">
              <strong>Success!</strong> {this.props.successMessage}
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

    if(this.props.errorMessage) {
      return (
        <Alert bsStyle="danger">
          <strong>Opps!</strong> {this.props.errorMessage}
        </Alert>
      )
    } else if (this.props.successMessage) {
      return (
        <Alert bsStyle="success">
          <strong>Sweet!</strong> {this.props.successMessage}
        </Alert>
      )
    }
  }

  renderField({ input, label, type, required, meta: { touched, error, warning } }) {

    return (
      <FormGroup>
        <div>
          <input className="form-control" {...input} placeholder={label} type={type}/>
          {touched && ((error && <div className='text-danger'>{error}</div>) || (warning && <div className='text-danger'>{warning}</div>))}
        </div>
      </FormGroup>
    )
  }
 
  renderForm() {

    if(!this.props.successMessage) {

      const loginPanelHeader = (<h4 className="form-signin-heading">Reset Password</h4>);
      const { handleSubmit, pristine, reset, submitting, valid } = this.props;

      return (
        <Panel className="form-signin" >
          <Panel.Body>
            {loginPanelHeader}
            <form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <FormGroup>
                <Field
                  name="password"
                  component={this.renderField}
                  type="password"
                  label="Password"
                />
              </FormGroup>
              <FormGroup>
                <Field
                  name="confirmPassword"
                  component={this.renderField}
                  type="password"
                  label="Confirm Password"
                />
              </FormGroup>
              <br/>
              {this.renderAlert()}
              <div>
                <Button bsStyle="primary" type="submit" block disabled={submitting || !valid}>Submit</Button>
              </div>
            </form>
            <br/>
            <div className="text-right">
              <Link to={ `/login` }>Proceed to Login {<FontAwesomeIcon icon="arrow-right"/>}</Link>
            </div>
          </Panel.Body>
        </Panel>
      )
    }
  }

                // <ReCAPTCHA
                // ref={e => reCaptchaInstance = e}
                // sitekey={ RECAPTCHA_SITE_KEY }
                // theme="dark"
                // size="normal"
                // onChange={this.onCaptchaChange.bind(this)}
              // />
              // <br/>
                // <Button bsStyle="primary" type="submit" block disabled={submitting || !valid || !this.state.reCaptcha}>Submit</Button>


  render() {

    return(
      <Row>
        <Col>
          {this.renderSuccess()}
          {this.renderForm()}
        </Col>
      </Row>
    )
  }

}

const validate = values => {

  const errors = {}

  if (!values.password) {
    errors.password = "Required";
  } else if (values.password.length < 8) {
    errors.password = 'Password must be 8 characters or more'
  } else if (values.password.match(/[ ]/)) {
    errors.password = 'Password can not include whitespace'
  }

  if(values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords must match";
  }

  return errors
}

function mapStateToProps(state) {
  return {
    errorMessage: state.auth.error,
    successMessage: state.auth.message
  }
}

// let reCaptchaInstance = null;

const afterSubmit = (result, dispatch) => {
  // reCaptchaInstance.reset();
  dispatch(reset('resetPassword'));
}

ResetPassword = reduxForm({
  form: 'resetPassword',
  validate: validate,
  onSubmitSuccess: afterSubmit
})(ResetPassword);

export default connect(mapStateToProps, actions)(ResetPassword);
