import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { reduxForm, Field, initialize, reset } from 'redux-form';
import { Alert, Button, Checkbox, FormGroup, FormControl, FormGroupItem, Panel, Tooltip, OverlayTrigger} from 'react-bootstrap';

import * as actions from '../actions';

const required =  value => !value ? 'Required' : undefined
const requiredArray =  value => !value || value.length === 0 ? 'At least one required' : undefined

class AccessCruise extends Component {

  constructor (props) {

    super(props);
 }

  componentWillMount() {

    this.props.fetchUsers();
    if(this.props.cruiseID) {
      this.props.initCruise(this.props.cruiseID);
    }
  }

  componentWillUnmount() {

    this.props.leaveUpdateCruiseForm();
  }

  handleFormSubmit(formProps) {

    this.props.updateCruise({...formProps});
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

  renderCheckboxGroup({ label, name, options, input, required, meta: { dirty, error, warning } }) {

    let requiredField = (required)? (<span className='text-danger'> *</span>) : ''
    let checkboxList = options.map((option, index) => {

      return (
          <Checkbox
            name={`${option.label}[${index}]`}
            label={option.label}
            key={`${label}.${index}`}
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
            {option.label}
          </Checkbox>
      );
    });

    return (
      <FormGroup>
        <label>{label}{requiredField}</label><br/>
        {checkboxList}
        {dirty && ((error && <div className='text-danger'>{error}</div>) || (warning && <div className='text-danger'>{warning}</div>))}
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
    const accessCruiseFormHeader = (<div>Cruise Access - {this.props.cruise.cruise_id}</div>);

    let userList = (this.props.users)? this.props.users.reduce((user_accumulator, user) => {

      if(!user.roles.includes("admin")) {
        user_accumulator.push({ value: user.id, label: user.fullname });
      }

      return user_accumulator;

    },[]) : []

    if (this.props.roles && (this.props.roles.includes("admin") || this.props.roles.includes('cruise_manager'))) {

      return (
        <Panel className="form-standard">
          <Panel.Heading>{accessCruiseFormHeader}</Panel.Heading>
          <Panel.Body>
            <form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>  
              <Field
                name="cruise_access_list"
                component={this.renderCheckboxGroup}
                label={"User Access"}
                options={userList}
              />
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

  return errors;

}

function mapStateToProps(state) {

  return {
    errorMessage: state.cruise.cruise_error,
    message: state.cruise.cruise_message,
    initialValues: state.cruise.cruise,
    cruise: state.cruise.cruise,
    roles: state.user.profile.roles,
    users: state.user.users
  };
}

AccessCruise = reduxForm({
  form: 'editCruiseAccess',
  enableReinitialize: true,
  validate: validate
})(AccessCruise);

export default connect(mapStateToProps, actions)(AccessCruise);