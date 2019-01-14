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

import { API_ROOT_URL } from '../url_config';
import * as actions from '../actions';

const dateFormat = "YYYY-MM-DD"
const timeFormat = "HH:mm"

const LOWERING_ROUTE = "/files/lowerings";

const cookies = new Cookies();

class UpdateLowering extends Component {

  constructor (props) {
    super(props);

    this.handleFileDownload = this.handleFileDownload.bind(this);
    this.handleFileDelete = this.handleFileDelete.bind(this);
  }

  static propTypes = {
    handleFormSubmit: PropTypes.func.isRequired
  };

  componentWillMount() {
    if(this.props.loweringID) {
      this.props.initLowering(this.props.loweringID);
    }
  }

  componentWillUnmount() {
    this.props.leaveUpdateLoweringForm();
  }

  handleFormSubmit(formProps) {
    formProps.lowering_tags = (formProps.lowering_tags)? formProps.lowering_tags.map(tag => tag.trim()): [];

    this.props.updateLowering({...formProps, lowering_files: this.pond.getFiles().map(file => file.serverId)});
    this.pond.removeFiles();
    this.props.handleFormSubmit()
  }

  handleFileDownload(loweringID, filename) {
    axios.get(`${API_ROOT_URL}${LOWERING_ROUTE}/${loweringID}/${filename}`,
    {
      headers: {
        authorization: cookies.get('token')
      }
    })
    .then((response) => {
        FileDownload(response.data, filename);
     })
    .catch((error)=>{
      console.log("JWT is invalid, logging out");
    });
  }

  handleFileDelete(loweringID, filename) {
    axios.delete(`${API_ROOT_URL}${LOWERING_ROUTE}/${loweringID}/${filename}`,
    {
      headers: {
        authorization: cookies.get('token')
      }
    })
    .then((response) => {
        this.props.initLowering(loweringID)
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
        <Datetime {...input} utc={true} value={input.value ? moment.utc(input.value).format(dateFormat + " " + timeFormat) : null} dateFormat={dateFormat} timeFormat={timeFormat} selected={input.value ? moment.utc(input.value, dateFormat + " " + timeFormat) : null }/>
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
    if(this.props.lowering.lowering_files && this.props.lowering.lowering_files.length > 0) {
      let files = this.props.lowering.lowering_files.map((file, index) => {
        return <li style={{ listStyleType: "none" }} key={`file_${index}`}><span onClick={() => this.handleFileDownload(this.props.lowering.id, file)}><FontAwesomeIcon className='text-primary' icon='download' fixedWidth /></span> <span onClick={() => this.handleFileDelete(this.props.lowering.id, file)}><FontAwesomeIcon className='text-danger' icon='trash' fixedWidth /></span><span> {file}</span></li>
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
    const updateLoweringFormHeader = (<div>Update Lowering</div>);

    if (this.props.roles && (this.props.roles.includes("admin") || this.props.roles.includes('cruise_manager'))) {

      return (
        <Panel>
          <Panel.Heading>{updateLoweringFormHeader}</Panel.Heading>
          <Panel.Body>
            <form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <Field
                name="lowering_id"
                component={this.renderField}
                type="text"
                label="Lowering ID"
                placeholder="i.e. 4023"
                required={true}
              />
              <Field
                name="lowering_description"
                component={this.renderTextArea}
                type="textarea"
                label="Lowering Description"
                placeholder="A brief description of the lowering"
                rows={10}
              />
              <Field
                name="lowering_location"
                type="text"
                component={this.renderField}
                label="Lowering Location"
                placeholder="i.e. Kelvin Seamount"
              />
              <Field
                name="start_ts"
                component={this.renderDatePicker}
                type="text"
                label="Start Date/Time (UTC)"
                required={true}
              />
              <Field
                name="stop_ts"
                component={this.renderDatePicker}
                type="text"
                label="Stop Date/Time (UTC)"
                required={true}
              />
              <Field
                name="lowering_tags"
                component={this.renderTextArea}
                type="textarea"
                label="Lowering Tags, comma delimited"
                placeholder="A comma-delimited list of tags, i.e. coral,chemistry,engineering"
              />
              <label>Lowering Files</label>
              {this.renderFiles()}
              <FilePond ref={ref => this.pond = ref} allowMultiple={true} 
                maxFiles={5} 
                server={{
                  url: API_ROOT_URL,
                  process: {
                    url: LOWERING_ROUTE + '/filepond/process/' + this.props.lowering.id,
                    headers: { authorization: cookies.get('token') },
                  },
                  load: {
                    url: LOWERING_ROUTE + '/filepond/load',
                    headers: { authorization: cookies.get('token') },
                  },
                  revert: {
                    url: LOWERING_ROUTE + '/filepond/revert',
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


            // {this.renderAdminOptions()}



function validate(formProps) {

  const errors = {};

  if (!formProps.lowering_id) {
    errors.lowering_id = 'Required'
  } else if (formProps.lowering_id.length > 15) {
    errors.lowering_id = 'Must be 15 characters or less'
  }

  if (!formProps.lowering_name) {
    errors.lowering_name = 'Required'
  }

  if ((formProps.start_ts != '') && (formProps.stop_ts != '')) {
    if(moment(formProps.stop_ts, dateFormat + " " + timeFormat).isBefore(moment(formProps.start_ts, dateFormat + " " + timeFormat))) {
      errors.stop_ts = 'Stop date must be later than start data'
    }
  }

  if (typeof formProps.lowering_tags == "string") {
    if (formProps.lowering_tags == '') {
      formProps.lowering_tags = []
    } else {
      formProps.lowering_tags = formProps.lowering_tags.split(',');
    }
  }

  return errors;

}

function mapStateToProps(state) {

  return {
    errorMessage: state.lowering.lowering_error,
    message: state.lowering.lowering_message,
    initialValues: state.lowering.lowering,
    lowering: state.lowering.lowering,
    roles: state.user.profile.roles
  };
}

UpdateLowering = reduxForm({
  form: 'editLowering',
  enableReinitialize: true,
  validate: validate
})(UpdateLowering);

export default connect(mapStateToProps, actions)(UpdateLowering);