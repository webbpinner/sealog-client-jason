import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import * as actions from '../../actions';

export default function(ComposedComponent) {
  class Authentication extends Component {
    static contextTypes = {
      router: PropTypes.object
    }

    constructor (props, context) {
      super(props, context);
    }

    componentDidMount() {
      this.props.validateJWT();
      if (!this.props.authenticated) {
        this.props.logout()
      }
    }

    componentWillUpdate(nextProps) {
      this.props.validateJWT();
      if (!nextProps.authenticated) {
        this.props.logout()
      }
    }

    render() {
      return <ComposedComponent {...this.props} />
    }
  }

  function mapStateToProps(state) {
    return { authenticated: state.auth.authenticated };
  }

  return connect(mapStateToProps, actions)(Authentication);
}