import React, { Component } from "react";
import { Link } from "react-router-dom";
import {
    message, Form, Input, Icon, Select, Checkbox, Button, AutoComplete,
  } from 'antd';
import './Register.css'
import AuthContext from '../contexts/auth-context'
const url = 'http://localhost:8000/graphql'
const success = () => {
  message.success('You have successfully registered');
};

const registerFailed = (msg) => {
  message.error(msg)
}
  
  class RegistrationForm extends Component {
    static contextType = AuthContext
    state = {
      confirmDirty: false,
      autoCompleteResult: [],
    };
  
    handleSubmit = (e) => {
      e.preventDefault();
      this.props.form.validateFieldsAndScroll((err, values) => {
        if (!err) {
          console.log('Received values of form: ', values)
          const requestBody = {
            query: `
                mutation
                {
                    createUser(userInput:{email: "${values.email}", password: "${values.password}"}) {
                        _id
                    }
                }
            `
          }

          fetch(url, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-type': 'application/json'
            }
          })
          .then(res => {
            return res.json()
          })
          .then(resJson => {
            const {data:{createUser}} = resJson
            if(createUser === null) {
              registerFailed(resJson.errors[0].message)
            }
            else {
              success()
              this.props.history.push('/auth')
            }
          })
          .catch(err => {
            registerFailed(err.message)
          })
        }
      });
    }
  
    handleConfirmBlur = (e) => {
      const value = e.target.value;
      this.setState({ confirmDirty: this.state.confirmDirty || !!value });
    }
  
    compareToFirstPassword = (rule, value, callback) => {
      const form = this.props.form;
      if (value && value !== form.getFieldValue('password')) {
        callback('Two passwords that you enter is inconsistent!');
      } else {
        callback();
      }
    }
  
    validateToNextPassword = (rule, value, callback) => {
      const form = this.props.form;
      if (value && this.state.confirmDirty) {
        form.validateFields(['confirm'], { force: true });
      }
      callback();
    }
  
    render() {
      const { getFieldDecorator } = this.props.form;
      return (
        <Form onSubmit={this.handleSubmit} className='register-form'>
          <Form.Item
          >
            {getFieldDecorator('email', {
              rules: [{
                type: 'email', message: 'The input is not valid E-mail!',
              }, {
                required: true, message: 'Please input your E-mail!',
              }],
            })(
                <Input prefix={<Icon type="mail" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Email" />
            )}
          </Form.Item>
          <Form.Item
          >
            {getFieldDecorator('password', {
              rules: [{
                required: true, message: 'Please input your password!',
              }, {
                validator: this.validateToNextPassword,
              }],
            })(
                <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="Password" />
            )}
          </Form.Item>
          <Form.Item
          >
            {getFieldDecorator('confirm', {
              rules: [{
                required: true, message: 'Please confirm your password!',
              }, {
                validator: this.compareToFirstPassword,
              }],
            })(
                <Input onBlur={this.handleConfirmBlur} prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="Password" />
            )}
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className='register-form-button'>Register</Button>
            Or <Link to="/auth">Login now!</Link>
          </Form.Item>
        </Form>
      );
    }
  }
  
  const RegisterPage = Form.create({ name: 'register_page' })(RegistrationForm);
  export default RegisterPage