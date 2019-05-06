import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { reduxForm, Field, initialize } from 'redux-form';
import Datetime from 'react-datetime';
import moment from 'moment';
import { Alert, Button, Card, Form, Tooltip, OverlayTrigger} from 'react-bootstrap';
import * as actions from '../actions';

const dateFormat = "YYYY-MM-DD"
const timeFormat = "HH:mm:ss"

class EventFilterForm extends Component {

  constructor (props) {
    super(props);

    this.renderDatePicker = this.renderDatePicker.bind(this);
    this.clearForm = this.clearForm.bind(this);
  }

  static propTypes = {
    handlePostSubmit: PropTypes.func.isRequired,
  };

  componentWillMount() {
  }

  componentWillUnmount() {
    this.props.leaveEventFilterForm();
  }

  handleFormSubmit(formProps) {

      if(formProps.startTS && typeof(formProps.startTS) === "object") {
        if(this.props.minDate && formProps.startTS.isBefore(moment(this.props.minDate))) {
          formProps.startTS = this.props.minDate
        } else {
          formProps.startTS = formProps.startTS.toISOString()
        }
      }

      if(formProps.stopTS && typeof(formProps.stopTS) === "object") {
        if(this.props.maxDate && formProps.stopTS.isAfter(moment(this.props.maxDate))) {
          formProps.stopTS = this.props.maxDate
        } else {
          formProps.stopTS = formProps.stopTS.toISOString()
        }
      }

    this.props.handlePostSubmit(formProps);
  }

  clearForm() {
    this.props.resetFields('eventFilterForm', {
      value: '',
      author: '',
      startTS: '',
      stopTS: '',
      freetext: '',
      datasource: ''
    });
    this.props.handlePostSubmit();
  }

  renderTextField({ input, label, placeholder, required, meta: { touched, error } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : ''
    let placeholder_txt = (placeholder)? placeholder: label

    return (
      <Form.Group>
        <Form.Label>{label}{requiredField}</Form.Label>
        <Form.Control type="text" {...input} placeholder={placeholder_txt} isInvalid={touched && error}/>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    )
  }

  renderDatePicker({ input, defaultValue, label, type, required, meta: { touched, error } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : ''
    
    return (
      <Form.Group>
        <Form.Label>{label}{requiredField}</Form.Label>
        <Datetime {...input} utc={true} value={input.value ? moment.utc(input.value).format(dateFormat + ' ' + timeFormat) : defaultValue} dateFormat={dateFormat} timeFormat={timeFormat} selected={input.value ? moment.utc(input.value, dateFormat) : null }/>
        {touched && (error && <div style={{width: "100%", marginTop: "0.25rem", fontSize: "80%"}} className='text-danger'>{error}</div>)}
      </Form.Group>
    )
  }

  renderAlert() {
    if (this.props.errorMessage) {
      return (
        <Alert variant="danger">
          <strong>Opps!</strong> {this.props.errorMessage}
        </Alert>
      )
    }
  }

  renderMessage() {
    if (this.props.message) {
      return (
        <Alert variant="success">
          <strong>Success!</strong> {this.props.message}
        </Alert>
      )
    }
  }

  render() {

    const { handleSubmit, pristine, reset, submitting, valid } = this.props;
    const eventFilterFormHeader = (<div>Event Filter</div>);
    const startTS = (this.props.minDate)? moment(this.props.minDate): null
    const stopTS = (this.props.maxDate)? moment(this.props.maxDate): null

    return (
      <Card border="secondary" className="form-standard">
        <Card.Header>{eventFilterFormHeader}</Card.Header>
        <Card.Body>
          <form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
            <Field
              name="value"
              component={this.renderTextField}
              label="Event Value"
              placeholder="i.e. SAMPLE"
              disabled={this.props.disabled}
            />
            <Field
              name="author"
              component={this.renderTextField}
              label="Author"
              placeholder="i.e. jsmith"
              disabled={this.props.disabled}
            />
            <Field
              name="startTS"
              component={this.renderDatePicker}
              defaultValue={startTS}
              label="Start Date/Time (UTC)"
              disabled={this.props.disabled}
            />
            <Field
              name="stopTS"
              component={this.renderDatePicker}
              defaultValue={stopTS}
              label="Stop Date/Time (UTC)"
              disabled={this.props.disabled}
            />
            <Field
              name="freetext"
              component={this.renderTextField}
              label="Freeform Text"
              placeholder="i.e. hi mom"
              disabled={this.props.disabled}
            />
            <Field
              name="datasource"
              component={this.renderTextField}
              label="Aux Data Source"
              placeholder="i.e. Framegrabber"
              disabled={this.props.disabled}
            />
            {this.renderAlert()}
            {this.renderMessage()}
            <div className="float-right">
              <Button variant="secondary" size="sm" disabled={submitting || this.props.disabled} onClick={this.clearForm}>Reset</Button>
              <Button variant="primary" size="sm" type="submit" disabled={submitting || !valid || this.props.disabled}>Update</Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    )
  }
}

function validate(formProps) {
  const errors = {};
  return errors;

}

function mapStateToProps(state) {

  return {
    initialValues: state.event.eventFilter,
  };

}

EventFilterForm = reduxForm({
  form: 'eventFilterForm',
  enableReinitialize: true,
  validate: validate
})(EventFilterForm);

export default connect(mapStateToProps, actions)(EventFilterForm);