import React, { Component } from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { reduxForm, Field, initialize } from 'redux-form';
import { Alert, Button, Col, FormGroup, FormControl, Grid, Panel, Row } from 'react-bootstrap';
import { API_ROOT_URL } from '../../client_config';
import * as actions from '../../actions';

const style = {wordWrap:'break-word'}
const cookies = new Cookies();

class UserProfile extends Component {

  constructor (props) {
    super(props);

    this.state = {
      showToken: false,
    }
  }

  componentDidUpdate() {
  }

  componentWillUnmount() {
    this.props.leaveUpdateProfileForm();
  }

  handleFormSubmit(formProps) {
    this.props.updateProfile(formProps);
  }

  renderField({ input, label, type, required, disabled, meta: { touched, error, warning } }) {

    let requiredField = (required)? (<span className='text-danger'> *</span>) : ''
    let disabledField = (disabled)? disabled : false;

    return (
      <FormGroup>
        <label>{label}{requiredField}</label>
        <FormControl {...input} placeholder={label} type={type} disabled={disabledField}/>
        {touched && ((error && <div className='text-danger'>{error}</div>) || (warning && <div className='text-danger'>{warning}</div>))}
      </FormGroup>
    )
  }


  showToken() {
    if(this.state.showToken) {
      return (
        <div>
          <p><strong className="text-danger">Warning: DO NOT SHARE THIS!!!</strong></p>
          <p>This token has <strong className="text-warning">FULL</strong> privledges to
          your account including access to you username and email.</p>
          <span style={{wordWrap: "break-word"}}>{cookies.get('token')}</span>
        </div>
      )      
    } else {
      return (
         <Button bsStyle="primary" block type="button" onClick={()=> {this.setState({showToken: true});setTimeout(()=>{this.setState({showToken: false})}, 10*1000)}}>Show API Token</Button>
      )
    }
  }


  renderAlert() {
    if (this.props.errorMessage) {
      return (
        <Alert bsStyle="danger">
          <strong>Opps!</strong> {this.props.errorMessage}
        </Alert>
      )
    }
  }

  renderMessage() {
    if (this.props.message) {
      return (
        <Alert bsStyle="success">
          <strong>Success!</strong> {this.props.message}
        </Alert>
      )
    }
  }

  render() {

    const { handleSubmit, pristine, reset, submitting, valid } = this.props;

    return (
      <Panel className="form-standard" >
        <Panel.Body>
          <form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
            <Field
              name="username"
              component={this.renderField}
              type="text"
              label="Username"
              required={true}
            />
            <Field
              name="fullname"
              type="text"
              component={this.renderField}
              label="Full Name"
              required={true}
            />
            <Field
              name="email"
              component={this.renderField}
              type="text"
              label="Email"
              disabled={true}
            />
            <Field
              name="password"
              component={this.renderField}
              type="password"
              label="Password"
            />
            <Field
              name="confirmPassword"
              component={this.renderField}
              type="password"
              label="Confirm Password"
            />
            {this.renderAlert()}
            {this.renderMessage()}
            <div className="pull-right">
              <Button bsStyle="default" type="button" disabled={pristine || submitting} onClick={reset}>Reset Values</Button>
              <Button bsStyle="primary" type="submit" disabled={pristine || submitting || !valid}>Update</Button>
            </div>
          </form>
          <br/>
          <br/>
          <br/>
          {this.showToken()}
        </Panel.Body>
      </Panel>
    )
  }
}

function validate(formProps) {
  const errors = {};

  if (!formProps.username) {
    errors.username = 'Required'
  } else if (formProps.username.length > 15) {
    errors.username = 'Must be 15 characters or less'
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

  if(formProps.password !== formProps.confirmPassword) {
    errors.password = "Passwords must match";
  }

  return errors;

}

function mapStateToProps(state) {

  return {
    errorMessage: state.user.profile_error,
    message: state.user.profile_message,
    initialValues: state.user.profile,
    userID: state.user.profile.id
  };

}

UserProfile = reduxForm({
  form: 'user_profile',
  enableReinitialize: true,
  validate: validate
})(UserProfile);

export default connect(mapStateToProps, actions)(UserProfile);