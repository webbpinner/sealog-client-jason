import axios from 'axios';
import moment from 'moment';
import Datetime from 'react-datetime';
import React, { Component } from 'react';
import Cookies from 'universal-cookie';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { reduxForm, Field, initialize, reset } from 'redux-form';
import { Alert, Button, Checkbox, Col, FormGroup, FormControl, FormGroupItem, Panel, Row, Tooltip, OverlayTrigger} from 'react-bootstrap';
import FileDownload from 'js-file-download';

import { FilePond, File, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';

import { API_ROOT_URL } from '../client_config';
import * as actions from '../actions';

const dateFormat = "YYYY-MM-DD"


const CRUISE_ROUTE = "/files/cruises";

const cookies = new Cookies();

class UpdateCruise extends Component {

  constructor (props) {
    super(props);

    this.handleFileDownload = this.handleFileDownload.bind(this);
    this.handleFileDelete = this.handleFileDelete.bind(this);
  }

  static propTypes = {
    handleFormSubmit: PropTypes.func.isRequired
  };

  componentWillMount() {
    if(this.props.cruiseID) {
      this.props.initCruise(this.props.cruiseID);
    }
  }

  componentWillUnmount() {
    this.props.leaveUpdateCruiseForm();
  }

  handleFormSubmit(formProps) {
    formProps.cruise_tags = (formProps.cruise_tags)? formProps.cruise_tags.map(tag => tag.trim()): [];

    formProps.cruise_additional_meta = {}

    if(formProps.cruise_participants) {
      formProps.cruise_additional_meta.cruise_participants = formProps.cruise_participants.map(participant => participant.trim())
      delete formProps.cruise_participants
    }

    if(formProps.cruise_name) {
      formProps.cruise_additional_meta.cruise_name = formProps.cruise_name
      delete formProps.cruise_name
    }

    if(formProps.cruise_description) {
      formProps.cruise_additional_meta.cruise_description = formProps.cruise_description
      delete formProps.cruise_description
    }

    formProps.cruise_additional_meta.cruise_files = this.pond.getFiles().map(file => file.serverId)

    this.props.updateCruise({...formProps });
    this.pond.removeFiles();
    this.props.handleFormSubmit()
  }

  handleFileDownload(cruiseID, filename) {
    axios.get(`${API_ROOT_URL}${CRUISE_ROUTE}/${cruiseID}/${filename}`,
    {
      headers: {
        authorization: cookies.get('token')
      },
      responseType: arraybuffer
    })
    .then((response) => {
        FileDownload(response.data, filename);
     })
    .catch((error)=>{
      console.log("JWT is invalid, logging out");
    });
  }

  handleFileDelete(cruiseID, filename) {
    axios.delete(`${API_ROOT_URL}${CRUISE_ROUTE}/${cruiseID}/${filename}`,
    {
      headers: {
        authorization: cookies.get('token')
      }
    })
    .then((response) => {
        this.props.initCruise(cruiseID)
     })
    .catch((error)=>{
      console.log("JWT is invalid, logging out");
    });
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

  renderFiles() {
    if(this.props.cruise.cruise_additional_meta && this.props.cruise.cruise_additional_meta.cruise_files && this.props.cruise.cruise_additional_meta.cruise_files.length > 0) {
      let files = this.props.cruise.cruise_additional_meta.cruise_files.map((file, index) => {
        return <li style={{ listStyleType: "none" }} key={`file_${index}`}><span onClick={() => this.handleFileDownload(this.props.cruise.id, file)}><FontAwesomeIcon className='text-primary' icon='download' fixedWidth /></span> <span onClick={() => this.handleFileDelete(this.props.cruise.id, file)}><FontAwesomeIcon className='text-danger' icon='trash' fixedWidth /></span><span> {file}</span></li>
      })
      return <div>{files}<br/></div>
    }
    return null
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
    const updateCruiseFormHeader = (<div>Update Cruise</div>);

    if (this.props.roles && (this.props.roles.includes("admin") || this.props.roles.includes('cruise_manager'))) {

      return (
        <Panel className="form-standard">
          <Panel.Heading>{updateCruiseFormHeader}</Panel.Heading>
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
                label="Full Name"
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
                label="Full Location"
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
              <label>Cruise Files</label>
              {this.renderFiles()}
              <FilePond ref={ref => this.pond = ref} allowMultiple={true} 
                maxFiles={5} 
                server={{
                  url: API_ROOT_URL,
                  process: {
                    url: CRUISE_ROUTE + '/filepond/process/' + this.props.cruise.id,
                    headers: { authorization: cookies.get('token') },
                  },
                  load: {
                    url: CRUISE_ROUTE + '/filepond/load',
                    headers: { authorization: cookies.get('token') },
                  },
                  revert: {
                    url: CRUISE_ROUTE + '/filepond/revert',
                    headers: { authorization: cookies.get('token') },
                  }
                }}
              >
              </FilePond>
              {this.renderAlert()}
              {this.renderMessage()}
              <div className="pull-right">
                <Button bsStyle="default" type="button" disabled={pristine || submitting} onClick={reset}>Reset Values</Button>
                <Button bsStyle="primary" type="submit" disabled={submitting || !valid}>Update</Button>
              </div>
            </form>
          </Panel.Body>
        </Panel>
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

  let initialValues = { ...state.cruise.cruise }

  if (initialValues.cruise_additional_meta) {
    if (initialValues.cruise_additional_meta.cruise_name) {
      initialValues.cruise_name = initialValues.cruise_additional_meta.cruise_name
    }

    if (initialValues.cruise_additional_meta.cruise_description) {
      initialValues.cruise_description = initialValues.cruise_additional_meta.cruise_description
    }

    if (initialValues.cruise_additional_meta.cruise_participants) {
      initialValues.cruise_participants = initialValues.cruise_additional_meta.cruise_participants
    }

    delete initialValues.cruise_additional_meta
  }

  return {
    errorMessage: state.cruise.cruise_error,
    message: state.cruise.cruise_message,
    initialValues: initialValues,
    cruise: state.cruise.cruise,
    roles: state.user.profile.roles
  };
}

UpdateCruise = reduxForm({
  form: 'editCruise',
  enableReinitialize: true,
  validate: validate
})(UpdateCruise);

export default connect(mapStateToProps, actions)(UpdateCruise);