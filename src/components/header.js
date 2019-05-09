import React, {Component} from 'react';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { ROOT_PATH, RECAPTCHA_SITE_KEY } from '../client_config';
import * as actions from '../actions';

class Header extends Component {

  constructor (props) {
    super(props);
  }

  componentDidMount() {
    if (this.props.authenticated) {
      this.props.updateProfileState();
    }
  }

  handleASNAPToggle() {
    if(this.props.asnapStatus) {
      if(this.props.asnapStatus.custom_var_value === 'Off') {
        this.props.updateCustomVars(this.props.asnapStatus.id, {custom_var_value: 'On'})
      } else {
        this.props.updateCustomVars(this.props.asnapStatus.id, {custom_var_value: 'Off'})
      }
    }
  }

  renderUserOptions() {
    if(this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager')) {
      return (
        <NavDropdown.Item href="/users">Users</NavDropdown.Item>
      );
    }
  }

  renderEventLoggingOptions() {
    if(this.props.authenticated) {
      return (
        <Nav.Link href="/cruise_menu">Review Cruises/Lowerings</Nav.Link>
      );
    }
  }

  renderEventManagementOptions() {
    if(this.props.roles.includes('admin')) {
      return (
        <NavDropdown.Item href="/event_management">Event Management</NavDropdown.Item>
      );
    }
  }

  renderEventTemplateOptions() {
    if(this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager') || this.props.roles.includes('event_manager')) {
      return (
        <NavDropdown.Item href="/event_templates">Event Templates</NavDropdown.Item>
      );
    }
  }

  renderLoweringOptions() {
    if(this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager')) {
      return (
        <NavDropdown.Item href="/lowerings">Lowerings</NavDropdown.Item>
      );
    }
  }

  renderCruiseOptions() {
    if(this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager')) {
      return (
        <NavDropdown.Item href="/cruises">Cruises</NavDropdown.Item>
      );
    }
  }

  renderTaskOptions() {
    if(this.props.roles.includes('admin')) {
      return (
        <NavDropdown.Item href="/tasks">Tasks</NavDropdown.Item>
      );
    }
  }

  renderToggleASNAP() {
    if(this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager') || this.props.roles.includes('event_manager') || this.props.roles.includes('event_logger')) {
      return (
        <NavDropdown.Item onClick={ () => this.handleASNAPToggle() }>Toggle ASNAP</NavDropdown.Item>
      );
    }
  }

  renderSystemManagerDropdown() {
    if(this.props.roles && (this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager') || this.props.roles.includes('event_manager'))) {
      return (
        <NavDropdown title={'System Management'} id="basic-nav-dropdown-system">
          {this.renderCruiseOptions()}
          {this.renderEventManagementOptions()}
          {this.renderEventTemplateOptions()}
          {this.renderLoweringOptions()}
          {this.renderTaskOptions()}
          {this.renderUserOptions()}
          {this.renderToggleASNAP()}
        </NavDropdown>
      );
    }
  }

  renderUserDropdown() {
    if(this.props.authenticated){
      return (
      <NavDropdown title={<span>{this.props.fullname} <FontAwesomeIcon icon="user" /></span>} id="basic-nav-dropdown-user">
          <NavDropdown.Item href="/profile" key="profile" >User Profile</NavDropdown.Item>
          {(this.props.fullname !== 'Guest' && RECAPTCHA_SITE_KEY === "")? (<NavDropdown.Item key="switch2Guest" onClick={ () => this.handleSwitchToGuest() } >Switch to Guest</NavDropdown.Item>) : null }
        <NavDropdown.Item key="logout" onClick={ () => this.handleLogout() } >Log Out</NavDropdown.Item>
      </NavDropdown>
      );
    }
  }

  handleLogout() {
    this.props.logout();
  }

  handleSwitchToGuest() {
    this.props.switch2Guest();
  }

  // handleSwitchToPilot() {
  //   this.props.switch2Pilot();
  // }

  // handleSwitchToStbdObs() {
  //   this.props.switch2StbdObs();
  // }

  // handleSwitchToPortObs() {
  //   this.props.switch2PortObs();
  // }

  render () {
    return (
      <Navbar collapseOnSelect expand="md" variant="dark" bg="dark">
        <Navbar.Brand href="/">Sealog - JASON</Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav"/>
        <Navbar.Collapse id="responsive-navbar-nav"className="justify-content-end">
          <Nav>
            {this.renderEventLoggingOptions()}
            {this.renderSystemManagerDropdown()}
            {this.renderUserDropdown()}
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );
  }
}

function mapStateToProps(state){
  let asnapStatus = (state.custom_var)? state.custom_var.custom_vars.find(custom_var => custom_var.custom_var_name === "asnapStatus") : null

  return {
    authenticated: state.auth.authenticated,
    fullname: state.user.profile.fullname,
    roles: state.user.profile.roles,
    asnapStatus: (state.custom_var)? state.custom_var.custom_vars.find(custom_var => custom_var.custom_var_name === "asnapStatus") : null
  };
}

export default connect(mapStateToProps, actions)(Header);
