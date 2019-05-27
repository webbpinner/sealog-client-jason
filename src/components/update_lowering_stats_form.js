import React, { Component } from 'react';
import { connect } from 'react-redux';
import { reduxForm, Field, initialize, reset } from 'redux-form';
import { Alert, Button, Col, Card, Form, Row, Tooltip, OverlayTrigger} from 'react-bootstrap';
import axios from 'axios';
import Cookies from 'universal-cookie';
import moment from 'moment';
import Datetime from 'react-datetime';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FileDownload from 'js-file-download';

import { FilePond, File, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';

import { API_ROOT_URL } from '../client_config';
import * as actions from '../actions';

const dateFormat = "YYYY-MM-DD"
const timeFormat = "HH:mm:ss.SSS"

const LOWERING_ROUTE = "/files/lowerings";

const cookies = new Cookies();

class UpdateLoweringStatsForm extends Component {

  constructor (props) {
    super(props);

  }

  static propTypes = {
    handleFormSubmit: PropTypes.func.isRequired,
    handleHide: PropTypes.func.isRequired,
    milestones: PropTypes.object.isRequired,
    stats: PropTypes.object.isRequired
  };

  componentDidMount() {

    let initialValues = {
      start: this.props.milestones.lowering_start,
      on_bottom: (this.props.milestones.lowering_on_bottom) ? this.props.milestones.lowering_on_bottom : null,
      off_bottom: (this.props.milestones.lowering_off_bottom) ? this.props.milestones.lowering_off_bottom : null,
      stop: this.props.milestones.lowering_stop,
      max_depth: (this.props.stats.max_depth) ? this.props.stats.max_depth : null,
      bbox_north: (this.props.stats.bounding_box.length == 4) ? this.props.stats.bounding_box[0] : null,
      bbox_east: (this.props.stats.bounding_box.length == 4) ? this.props.stats.bounding_box[1] : null,
      bbox_south: (this.props.stats.bounding_box.length == 4) ? this.props.stats.bounding_box[2] : null,
      bbox_west: (this.props.stats.bounding_box.length == 4) ? this.props.stats.bounding_box[3] : null,
    }

    this.props.initialize(initialValues);
  }

  componentWillUnmount() {
    // this.props.leaveUpdateLoweringForm();
  }

  handleFormSubmit(formProps) {

    let milestones = {
      lowering_start: (formProps.start._isAMomentObject) ? formProps.start.toISOString() : formProps.start,
      lowering_on_bottom: (formProps.on_bottom && formProps.on_bottom._isAMomentObject) ? formProps.on_bottom.toISOString() : formProps.on_bottom,
      lowering_off_bottom: (formProps.on_bottom && formProps.off_bottom._isAMomentObject) ? formProps.off_bottom.toISOString() : formProps.off_bottom,
      lowering_stop: (formProps.stop._isAMomentObject) ? formProps.stop.toISOString() : formProps.stop,
    }

    let stats= {
      max_depth: formProps.max_depth,
    }

    if((formProps.bbox_north == null || formProps.bbox_north == "") && (formProps.bbox_east == null || formProps.bbox_east == "") && (formProps.bbox_south == null || formProps.bbox_south == "") && (formProps.bbox_west == null || formProps.bbox_west == "")) {
      stats.bounding_box=[]
    }
    else {
      stats.bounding_box=[formProps.bbox_north, formProps.bbox_east, formProps.bbox_south, formProps.bbox_west]
    }

    this.props.handleFormSubmit(milestones, stats)
  }

  renderTextField({ input, label, placeholder, required, meta: { touched, error } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : ''
    let placeholder_txt = (placeholder)? placeholder: label

    return (
      <Form.Group as={Row}>
        <Form.Label column sm={3}>{label}{requiredField}</Form.Label>
        <Col sm={5}>
          <Form.Control size="sm" type="text" {...input} placeholder={placeholder_txt} isInvalid={touched && error}/>
          <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
        </Col>
      </Form.Group>
    )
  }

  renderDatePicker({ input, label, type, required, meta: { touched, error } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : ''
    
    return (
      <Form.Group as={Row}>
        <Form.Label column sm={6}>{label}{requiredField}</Form.Label>
        <Col sm={5}>
          <Datetime {...input} inputProps={{className: "form-control form-control-sm"}} utc={true} value={input.value ? moment.utc(input.value).format(dateFormat + ' ' + timeFormat) : null} dateFormat={dateFormat} timeFormat={timeFormat} selected={input.value ? moment.utc(input.value) : null }/>
          {touched && (error && <div style={{width: "100%", marginTop: "0.25rem", fontSize: "80%"}} className='text-danger'>{error}</div>)}
        </Col>
      </Form.Group>
    )
  }

  render() {

    const { handleSubmit, pristine, reset, submitting, valid } = this.props;
    const updateLoweringFormHeader = (<div>Update Lowering</div>);

    if (this.props.roles && (this.props.roles.includes("admin") || this.props.roles.includes('cruise_manager'))) {

      return (
            <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <Row>
                <Col md={6}>
                  <Field
                    name="start"
                    component={this.renderDatePicker}
                    label="Start Date/Time (UTC)"
                    required={true}
                  />
                  <Field
                    name="on_bottom"
                    component={this.renderDatePicker}
                    label="On Bottom Date/Time (UTC)"
                  />
                  <Field
                    name="off_bottom"
                    component={this.renderDatePicker}
                    label="Off Bottom Date/Time (UTC)"
                  />
                  <Field
                    name="stop"
                    component={this.renderDatePicker}
                    label="Stop Date/Time (UTC)"
                    required={true}
                  />
                </Col>
                <Col md={6}>
                  <Field
                    name="max_depth"
                    component={this.renderTextField}
                    label="Max Depth"
                    placeholder="in meters"
                  />
                  <Field
                    name="bbox_north"
                    component={this.renderTextField}
                    label="North"
                    placeholder="in ddeg"
                  />
                  <Field
                    name="bbox_east"
                    component={this.renderTextField}
                    label="East"
                    placeholder="in ddeg"
                  />
                  <Field
                    name="bbox_south"
                    component={this.renderTextField}
                    label="South"
                    placeholder="in ddeg"
                  />
                  <Field
                    name="bbox_west"
                    component={this.renderTextField}
                    label="West"
                    placeholder="in ddeg"
                  />
                </Col>
              </Row>
              <Row>
                <Col xs={12}>
                  <div className="float-right">
                    <Button variant="secondary" size="sm" onClick={this.props.handleHide}>Cancel</Button>
                    <Button variant="warning" size="sm" type="submit" disabled={submitting || !valid}>Done</Button>
                  </div>
                </Col>
              </Row>
            </Form>
      )
    } else {
      return (
        <div>
          What are YOU doing here?
        </div>
      )
    }
  }
}

function validate(formProps) {

  const errors = {};

  if (formProps.start === '') {
    errors.start_ts = 'Required'
  } else if (!moment.utc(formProps.start_ts).isValid()) {
    errors.start_ts = 'Invalid timestamp'
  }

  if (formProps.stop === '') {
    errors.stop_ts = 'Required'
  } else if (!moment.utc(formProps.stop_ts).isValid()) {
    errors.stop_ts = 'Invalid timestamp'
  }

  if ((formProps.start !== '') && (formProps.stop !== '')) {
    if(moment(formProps.stop_ts, dateFormat + " " + timeFormat).isBefore(moment(formProps.start_ts, dateFormat + " " + timeFormat))) {
      errors.stop_ts = 'Stop date must be later than start data'
    }
  }

  if (!(formProps.max_depth >= 0)) {
    errors.max_depth = 'Must be a positive floating point number'
  }

  if (!(formProps.bbox_north >= -60 && formProps.bbox_north <= 60)) {
    errors.bbox_north = 'Must be a number between +/- 60'
  }

  if (!(formProps.bbox_east >= -180 && formProps.bbox_east <= 180)) {
    errors.bbox_east = 'Must be a number between +/- 180'
  }

  if (!(formProps.bbox_south >= -60 && formProps.bbox_south <= 60)) {
    errors.bbox_south = 'Must be a number between +/- 60'
  }

  if (!(formProps.bbox_west >= -180 && formProps.bbox_west <= 180)) {
    errors.bbox_west = 'Must be a number between +/- 180'
  }

  return errors;

}

function mapStateToProps(state) {

  return {
    roles: state.user.profile.roles
  };
}

UpdateLoweringStatsForm = reduxForm({
  form: 'editLoweringStats',
  // enableReinitialize: true,
  validate: validate
})(UpdateLoweringStatsForm);

export default connect(mapStateToProps, actions)(UpdateLoweringStatsForm);