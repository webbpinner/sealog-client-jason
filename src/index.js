import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Cookies from 'universal-cookie';
import { ThemeSwitcher } from 'react-bootstrap-theme-switcher';
//import "typeface-roboto";

import { AUTH_USER } from './actions/types';

import Header from './components/header';
import Footer from './components/footer';
import Login from './components/auth/login';
import Logout from './components/auth/logout';
import Profile from './components/auth/profile';
import Register from './components/auth/register';
import RequireAuth from './components/auth/require_auth';
import RequireUnauth from './components/auth/require_unauth';
import CruiseMenu from './components/cruise_menu';
import Users from './components/users';
import Tasks from './components/tasks';
import EventLogging from './components/event_logging';
import EventTemplates from './components/event_templates';
import Lowerings from './components/lowerings';
import LoweringReplay from './components/lowering_replay';
import LoweringSearch from './components/lowering_search';
import Cruises from './components/cruises';

require("font-awesome-webpack");
require('typeface-roboto');

import { ROOT_PATH } from './url_config';

import store from './store';
import history from './history';

const cookies = new Cookies();

const token = cookies.get('token');
if (token) {

  store.dispatch({ type: AUTH_USER });

}

    // <ThemeSwitcher themePath={ `${ROOT_PATH}/themes` } defaultTheme="cyborg" storeThemeKey="theme">
    // </ThemeSwitcher>

ReactDOM.render(
  <Provider store={store}>
      <ConnectedRouter history={history}>
          <div>
            <Header />
            <Route path={`/github`} exact={true} component={() => window.location = 'https://github.com/webbpinner/sealog-client'}/>
            <Route path={`/license`} exact={true} component={() => window.location = 'http://www.gnu.org/licenses/gpl-3.0.html'}/>
            <Route path={ `/` } exact={true} component={RequireAuth(EventLogging)}/>
            <Route path={ `/cruise_menu` } exact={true} component={RequireAuth(CruiseMenu)} />
            <Route path={ `/cruises` } exact={true} component={RequireAuth(Cruises)} />
            <Route path={ `/event_templates` } exact={true} component={RequireAuth(EventTemplates)} />
            <Route path={ `/login` } exact={true} component={RequireUnauth(Login)} />
            <Route path={ `/logout` } exact={true} component={Logout} />
            <Route path={ `/lowerings` } exact={true} component={RequireAuth(Lowerings)} />
            <Route path={ `/lowering_replay/:id` } exact={true} component={RequireAuth(LoweringReplay)} />
            <Route path={ `/lowering_search/:id` } exact={true} component={RequireAuth(LoweringSearch)} />
            <Route path={ `/profile` } exact={true} component={RequireAuth(Profile)} />
            <Route path={ `/register` } exact={true} component={Register} />
            <Route path={ `/tasks` } exact={true} component={RequireAuth(Tasks)} />
            <Route path={ `/users` } exact={true} component={RequireAuth(Users)} />
            <Footer />
          </div>
      </ConnectedRouter>
  </Provider>
  , document.querySelector('.container'));
