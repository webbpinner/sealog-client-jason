import React, { Component } from 'react';
import { connect } from 'react-redux';
import { reduxForm, Field, reset } from 'redux-form';
import { Button, Form, InputGroup } from 'react-bootstrap';
import * as actions from '../actions';

class EventInput extends Component {

  constructor (props) {
    super(props);
  }

  handleFormSubmit({eventFreeText}) {
    this.props.createEvent('FREE_FORM', eventFreeText);
  }

  render() {
    const { handleSubmit, pristine, reset, submitting, valid } = this.props;

    return (
      <Form style={this.props.style} onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
        <InputGroup>
          <Field
            name="eventFreeText"
            component="input"
            type="text"
            placeholder="Type new event"
            className="form-control"
          />
          <InputGroup.Append>
            <Button block type="submit" disabled={submitting || !valid}>Submit</Button>
          </InputGroup.Append>
        </InputGroup>
      </Form>
    )
  }
}

function mapStateToProps(state) {
  return {}
}

function afterSubmit(result, dispatch) {
    dispatch(reset('eventInput'));
}

EventInput = reduxForm({
  form: 'eventInput',
  onSubmitSuccess: afterSubmit
})(EventInput);

export default connect(mapStateToProps, actions)(EventInput);
