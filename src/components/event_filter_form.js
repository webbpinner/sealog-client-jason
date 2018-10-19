import React, { Component } from 'react';
import { connect } from 'react-redux';
import { reduxForm, Field, initialize } from 'redux-form';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import moment from 'moment';
import { Alert, Button, Checkbox, Col, FormGroup, FormControl, FormGroupItem, Panel, Row, Tooltip, OverlayTrigger} from 'react-bootstrap';
import * as actions from '../actions';

const dateFormat = "YYYY-MM-DD"
const timeFormat = "HH:mm:ss"

class EventFilterForm extends Component {

  constructor (props) {
    super(props);

    this.renderDatePicker = this.renderDatePicker.bind(this);
    this.clearForm = this.clearForm.bind(this);
  }

  componentWillMount() {
  }

  componentWillUnmount() {
    this.props.leaveEventFilterForm();
  }

  handleFormSubmit(formProps) {

    if(formProps.startTS && typeof(formProps.startTS) === "object") {
      // console.log("converting")
      if(formProps.startTS.isBefore(moment(this.props.lowering.start_ts))) {
        formProps.startTS = this.props.lowering.start_ts
      } else {
        formProps.startTS = formProps.startTS.toISOString()
      }
      // console.log(formProps.startTS)
    }
    
    if(formProps.stopTS && typeof(formProps.stopTS) === "object") {
      // console.log("converting")
      if(formProps.stopTS.isAfter(moment(this.props.lowering.stop_ts))) {
        formProps.stopTS = this.props.lowering.stop_ts
      } else {
        formProps.stopTS = formProps.stopTS.toISOString()
      }
      // console.log(formProps.stopTS)
    }

    // console.log("loweringID:",this.props.lowering_id)
    this.props.updateEventFilterForm(formProps, this.props.lowering_id, this.props.hideASNAP);
    this.props.handlePostSubmit();
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
  }

  renderField({ input, label, type, placeholder, disabled, meta: { touched, error, warning } }) {
    return (
      <FormGroup>
        <label>{label}</label>
        <FormControl {...input} placeholder={placeholder} type={type} disabled={disabled}/>
        {touched && ((error && <div className='text-danger'>{error}</div>) || (warning && <div className='text-danger'>{warning}</div>))}
      </FormGroup>
    )
  }

  renderDatePicker({ input, defaultValue, label, type, disabled, rows = 4, meta: { touched, error, warning } }) {
    return (
      <FormGroup>
        <label>{label}</label>
        <Datetime {...input} utc={true} value={input.value ? moment.utc(input.value).format(dateFormat + " " + timeFormat) : defaultValue} dateFormat={dateFormat} timeFormat={timeFormat} selected={input.value ? moment.utc(input.value, dateFormat + " " + timeFormat) : null } inputProps={ { disabled: disabled}}/>
        {touched && ((error && <div className='text-danger'>{error}</div>) || (warning && <div className='text-danger'>{warning}</div>))}
      </FormGroup>
    )
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
    const loweringSearchEventFilterFormHeader = (<div>Event Filter</div>);
    const startTS = (this.props.lowering.start_ts)? moment(this.props.lowering.start_ts): null
    const stopTS = (this.props.lowering.stop_ts)? moment(this.props.lowering.stop_ts): null

    return (
      <Panel>
        <Panel.Heading>{loweringSearchEventFilterFormHeader}</Panel.Heading>
        <Panel.Body>
          <form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
            <Field
              name="value"
              component={this.renderField}
              type="text"
              label="Event Value"
              placeholder="i.e. SAMPLE"
              disabled={this.props.disabled}
            />
            <Field
              name="author"
              type="text"
              component={this.renderField}
              label="Author"
              placeholder="i.e. jsmith"
              disabled={this.props.disabled}
            />
            <Field
              name="startTS"
              component={this.renderDatePicker}
              type="text"
              defaultValue={startTS}
              label="Start Date/Time (UTC)"
              disabled={this.props.disabled}
            />
            <Field
              name="stopTS"
              component={this.renderDatePicker}
              type="text"
              defaultValue={stopTS}
              label="Stop Date/Time (UTC)"
              disabled={this.props.disabled}
            />
            <Field
              name="freetext"
              component={this.renderField}
              type="text"
              label="Freeform Text"
              placeholder="i.e. hi mom"
              disabled={this.props.disabled}
            />
            <Field
              name="datasource"
              component={this.renderField}
              type="text"
              label="Aux Data Source"
              placeholder="i.e. Framegrabber"
              disabled={this.props.disabled}
            />
            {this.renderAlert()}
            {this.renderMessage()}
            <div className="pull-right">
              <Button bsStyle="default" bsSize="sm" type="button" disabled={submitting || this.props.disabled} onClick={this.clearForm}>Reset</Button>
              <Button bsStyle="primary" bsSize="sm" type="submit" disabled={submitting || !valid || this.props.disabled}>Update</Button>
            </div>
          </form>
        </Panel.Body>
      </Panel>
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
    lowering: state.lowering.lowering
  };

}

EventFilterForm = reduxForm({
  form: 'eventFilterForm',
  enableReinitialize: true,
  validate: validate
})(EventFilterForm);

export default connect(mapStateToProps, actions)(EventFilterForm);