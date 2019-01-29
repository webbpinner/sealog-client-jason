import moment from 'moment';
import Datetime from 'react-datetime';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { reduxForm, Field, initialize, reset } from 'redux-form';
import { Alert, Button, Checkbox, Radio, Col, FormGroup, FormControl, FormGroupItem, Grid, Panel, Row, Tooltip, OverlayTrigger } from 'react-bootstrap';
import * as actions from '../actions';

const dateFormat = "YYYY-MM-DD"

class CreateCruise extends Component {

  componentWillUnmount() {
    this.props.leaveCreateCruiseForm();
  }

  handleFormSubmit(formProps) {
    formProps.cruise_participants = (formProps.cruise_participants)? formProps.cruise_participants.map(participant => participant.trim()): [];
    formProps.cruise_tags = (formProps.cruise_tags)? formProps.cruise_tags.map(tag => tag.trim()): [];
    this.props.createCruise(formProps);
  }

  renderField({ input, label, placeholder, required, type, meta: { touched, error, warning } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : ''
    let placeholder_txt = (placeholder)? placeholder: label

    return (
      <FormGroup>
        <label>{label}{requiredField}</label>
        <FormControl {...input} placeholder={placeholder_txt} type={type}/>
        {touched && (error && <div className='text-danger'>{error}</div>) || (warning && <div className='text-danger'>{warning}</div>)}
      </FormGroup>
    )
  }

  renderTextArea({ input, label, type, placeholder, required, rows = 4, meta: { touched, error, warning } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : ''
    let placeholder_txt = (placeholder)? placeholder: label
    return (
      <FormGroup>
        <label>{label}{requiredField}</label>
        <FormControl {...input} placeholder={placeholder_txt} componentClass={type} rows={rows}/>
        {touched && ((error && <div className='text-danger'>{error}</div>) || (warning && <div className='text-danger'>{warning}</div>))}
      </FormGroup>
    )
  }

  renderDatePicker({ input, label, type, required, meta: { touched, error, warning } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : ''
    return (
      <FormGroup>
        <label>{label}{requiredField}</label>
        <Datetime {...input} utc={true} value={input.value ? moment.utc(input.value).format(dateFormat) : null} dateFormat={dateFormat} timeFormat={false} selected={input.value ? moment.utc(input.value, dateFormat) : null }/>
        {touched && (error && <div className='text-danger'>{error}</div>) || (warning && <div className='text-danger'>{warning}</div>)}
      </FormGroup>
    )
  }

  renderCheckboxGroup({ label, name, options, input, meta: { dirty, error, warning } }) {    

    let checkboxList = options.map((option, index) => {

      let tooltip = (option.description)? (<Tooltip id={`${option.value}_Tooltip`}>{option.description}</Tooltip>) : null
      let overlay = (tooltip != null)? (<OverlayTrigger placement="right" overlay={tooltip}><span>{option.label}</span></OverlayTrigger>) : option.label

      return (
          <Checkbox
            name={`${option.label}[${index}]`}
            key={`${label}.${index}`}
            value={option.value}
            checked={input.value.indexOf(option.value) !== -1}
            onChange={event => {
              const newValue = [...input.value];
              if(event.target.checked) {
                newValue.push(option.value);
              } else {
                newValue.splice(newValue.indexOf(option.value), 1);
              }
              return input.onChange(newValue);
            }}
          >
            { overlay }
          </Checkbox>
      );
    });

    return (
      <FormGroup>
        <label>{label}</label>
        {checkboxList}
        {(error && <div className='text-danger'>{error}</div>) || (warning && <div className='text-danger'>{warning}</div>)}
      </FormGroup>
    );
  }


  renderCheckbox({ input, label, meta: { dirty, error, warning } }) {    

    return (
      <FormGroup>
        <Checkbox
          checked={input.value ? true : false}
          onChange={(e) => input.onChange(e.target.checked)}
        >
          {label}
        </Checkbox>
        {(error && <div className='text-danger'>{error}</div>) || (warning && <div className='text-danger'>{warning}</div>)}
      </FormGroup>
    );
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
    const createCruiseFormHeader = (<div>Create New Cruise</div>);

    if (this.props.roles) {

      if(this.props.roles.includes("admin")) {

        return (
          <Panel className="form-standard" >
            <Panel.Heading>{createCruiseFormHeader}</Panel.Heading>
            <Panel.Body>
              <form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
                <Field
                  name="cruise_id"
                  component={this.renderField}
                  type="text"
                  label="Cruise ID"
                  placeholder="i.e. AT02-17"
                  required={true}
                />
                <Field
                  name="cruise_name"
                  type="text"
                  component={this.renderField}
                  label="Cruise Name"
                  placeholder="i.e. Lost City 2018"
                  required={true}
                />
                <Field
                  name="cruise_description"
                  component={this.renderTextArea}
                  type="textarea"
                  label="Cruise Description"
                  placeholder="A brief summary of the cruise"
                  rows={10}
                />
                <Field
                  name="cruise_location"
                  type="text"
                  component={this.renderField}
                  label="Cruise Location"
                  placeholder="i.e. Lost City"
                />
                <Field
                  name="start_ts"
                  component={this.renderDatePicker}
                  type="text"
                  label="Start Date (UTC)"
                  required={true}
                />
                <Field
                  name="stop_ts"
                  component={this.renderDatePicker}
                  type="text"
                  label="Stop Date (UTC)"
                  required={true}
                />
                <Field
                  name="cruise_pi"
                  component={this.renderField}
                  type="text"
                  label="Primary Investigator"
                  placeholder="i.e. Dr. Susan Lang"
                  required={true}
                />
                <Field
                  name="cruise_participants"
                  component={this.renderTextArea}
                  type="textarea"
                  label="Cruise Participants, comma delimited"
                  placeholder="A comma-delimited list of names, i.e. Dave Butterfield,Sharon Walker"
                />
                <Field
                  name="cruise_tags"
                  component={this.renderTextArea}
                  type="textarea"
                  label="Cruise Tags, comma delimited"
                  placeholder="A comma-delimited list of tags, i.e. coral,chemistry,engineering"
                />
                {this.renderAlert()}
                {this.renderMessage()}
                <div className="pull-right">
                  <Button bsStyle="default" type="button" disabled={pristine || submitting} onClick={reset}>Reset Form</Button>
                  <Button bsStyle="primary" type="submit" disabled={submitting || !valid}>Create</Button>
                </div>
              </form>
            </Panel.Body>
          </Panel>
        )
      } else {
        return null
      }
    } else {
      return (
        <div>
          Loading...
        </div>
      )
    }
  }
}

function validate(formProps) {
  const errors = {};

  if (!formProps.cruise_id) {
    errors.cruise_id = 'Required'
  } else if (formProps.cruise_id.length > 15) {
    errors.cruise_id = 'Must be 15 characters or less'
  }

  if (!formProps.cruise_name) {
    errors.cruise_name = 'Required'
  }

  if (!formProps.cruise_pi) {
    errors.cruise_pi = 'Required'
  }

  if (!formProps.start_ts) {
    errors.start_ts = 'Required'
  }

  if (!formProps.stop_ts) {
    errors.stop_ts = 'Required'
  }

  if ((formProps.start_ts != '') && (formProps.stop_ts != '')) {
    if(moment(formProps.stop_ts, dateFormat).isBefore(moment(formProps.start_ts, dateFormat))) {
      errors.stop_ts = 'Stop date must be later than start data'
    }
  }

  if (typeof formProps.cruise_tags == "string") {
    if (formProps.cruise_tags == '') {
      formProps.cruise_tags = []
    } else {
      formProps.cruise_tags = formProps.cruise_tags.split(',');
    }
  }

  if (typeof formProps.cruise_participants == "string") {
    if (formProps.cruise_participants == '') {
      formProps.cruise_participants = []
    } else {
      formProps.cruise_participants = formProps.cruise_participants.split(',');
    }
  }

  return errors;

}

function mapStateToProps(state) {

  return {
    errorMessage: state.cruise.cruise_error,
    message: state.cruise.cruise_message,
    roles: state.user.profile.roles
  };
}

const afterSubmit = (result, dispatch) =>
  dispatch(reset('createCruise'));

CreateCruise = reduxForm({
  form: 'createCruise',
  enableReinitialize: true,
  validate: validate,
  onSubmitSuccess: afterSubmit
})(CreateCruise);

export default connect(mapStateToProps, actions)(CreateCruise);