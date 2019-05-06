import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import * as actions from '../../actions';

export default function(ComposedComponent) {
  class Unauthentication extends Component {
    static contextTypes = {
      router: PropTypes.object
    }

    constructor (props, context) {
      super(props, context);
    }

    componentWillMount() {
      if (this.props.authenticated) {
        this.props.gotoHome();
      }
    }

    componentWillUpdate(nextProps) {
      if (nextProps.authenticated) {
        this.props.gotoHome();
      }
    }

    render() {
      return <ComposedComponent {...this.props} />
    }
  }

  function mapStateToProps(state) {
    return { authenticated: state.auth.authenticated };
  }

  return connect(mapStateToProps, actions)(Unauthentication);
}