/**
 * React Starter Kit for Firebase
 * https://github.com/kriasoft/react-firebase-starter
 * Copyright (c) 2015-present Kriasoft | MIT License
 */

/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import RelayPropTypes from 'react-relay/lib/RelayPropTypes';
import Button from 'material-ui/Button';
import Dialog, { DialogTitle, DialogContent } from 'material-ui/Dialog';
import { FormControl, FormHelperText } from 'material-ui/Form';
import styled from 'styled-components';
import firebase from '@firebase/app';

import SignInMutation from './SignInMutation';

const Title = styled(DialogTitle)`
  && {
    text-align: center;
  }
`;

const defaultState = {
  error: null,
  loading: false,
};

class LoginDialog extends React.Component {
  static contextTypes = {
    relay: RelayPropTypes.Relay,
    reset: PropTypes.func.isRequired,
  };

  state = { ...defaultState };

  signInWithFacebook = async event => {
    const { relay: { environment }, reset } = this.context;
    this.setState({ ...defaultState, loading: true });

    try {
      const { user, credential } = await firebase
        .auth()
        .signInWithPopup(new firebase.auth.FacebookAuthProvider());
      const idToken = await user.getIdToken();

      const { token } = await SignInMutation.commit(environment, {
        idToken,
        refreshToken: user.refreshToken,
      });

      if (token) {
        const newUser = await firebase.auth().signInWithCustomToken(token);
        await newUser.linkWithCredential(credential).catch(err => {
          if (err.code === 'auth/email-already-exists') {
            return newUser.linkWithCredential(err.credential);
          } else {
            return Promise.reject(err);
          }
        });
        await SignInMutation.commit(environment, {
          idToken: await newUser.getIdToken(),
          refreshToken: newUser.refreshToken,
        });
      }

      this.setState({ ...defaultState });
      this.props.onClose(event);
      reset();
    } catch (err) {
      this.setState({ ...defaultState, error: err.message });
    }
  };

  render() {
    const { error } = this.state;
    return (
      <Dialog {...this.props}>
        <Title>Sign In</Title>
        <DialogContent>
          <FormControl
            aria-describedby={error && 'login-error'}
            error={!!error}
          >
            <Button
              color="primary"
              variant="raised"
              disabled={this.state.loading}
              onClick={this.signInWithFacebook}
            >
              Sign in with Facebook
            </Button>
            {this.state.error && (
              <FormHelperText id="login-error">
                {this.state.error}
              </FormHelperText>
            )}
          </FormControl>
        </DialogContent>
      </Dialog>
    );
  }
}

export default LoginDialog;
