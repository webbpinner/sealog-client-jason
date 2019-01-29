import React, { Component } from 'react';
import { reduxForm, Field } from 'redux-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Grid, Row, Col, FormGroup, Checkbox, Panel, Button, Alert, Image } from 'react-bootstrap';
// import ReCAPTCHA from "react-google-recaptcha";
import * as actions from '../../actions';
// import { ROOT_PATH, RECAPTCHA_SITE_KEY } from '../../client_config';
import { ROOT_PATH } from '../../client_config';

class ForgotPassword extends Component {
 
 constructor (props) {
    super(props);

    // this.state = { 
    //   reCaptcha: null
    // }
  }

  componentWillUnmount() {
    this.props.leaveLoginForm();
  }

  handleFormSubmit({ email }) {
    // let reCaptcha = this.state.reCaptcha
    // this.props.forgotPassword({email, reCaptcha});
    this.props.forgotPassword({email});
  }

  // onCaptchaChange(token) {
  //   this.setState({reCaptcha: token})
  // }

  renderSuccess() {

    if (this.props.successMessage) {
      const panelHeader = (<h4 className="form-signin-heading">Forgot Password</h4>);

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

  renderAlert(){

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

  renderForm() {

    if(!this.props.successMessage) {

      const panelHeader = (<h4 className="form-signin-heading">Forgot Password</h4>);
      const { handleSubmit, pristine, reset, submitting, valid } = this.props;

      return (
        <Panel className="form-signin" >
          <Panel.Body>
            {panelHeader}
            <form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <FormGroup>
                <Field
                  name="email"
                  component="input"
                  type="text"
                  placeholder="Email Address"
                  className="form-control"
                />
              </FormGroup>
              {this.renderAlert()}
              <Button bsStyle="primary" type="submit" block disabled={submitting || !valid}>Submit</Button>
            </form>
            <br/>
            <div className="text-right">
              <Link to={ `/login` }>Back to Login {<FontAwesomeIcon icon="arrow-right"/>}</Link>
            </div>
          </Panel.Body>
        </Panel>
      )
    }
  }
              // <Button bsStyle="primary" type="submit" block disabled={submitting || !valid || !this.state.reCaptcha}>Submit</Button>
              // <ReCAPTCHA
              //   ref={e => reCaptchaInstance = e}
              //   sitekey={RECAPTCHA_SITE_KEY}
              //   theme="dark"
              //   size="normal"
              //   onChange={this.onCaptchaChange.bind(this)}
              // />
              // <br/>

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

  // console.log(values)
  const errors = {}
  if (!values.email) {
    errors.email = 'Required'
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
}

ForgotPassword = reduxForm({
  form: 'forgotPassword',
  validate: validate,
  onSubmitSuccess: afterSubmit
})(ForgotPassword);

export default connect(mapStateToProps, actions)(ForgotPassword);
