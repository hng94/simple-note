import React, { Component } from "react";
import { Link } from "react-router-dom";

import {
    Form, Icon, Input, Button, Checkbox,
} from 'antd';

import './Auth.css';
import AuthContext from '../contexts/auth-context'

const url = 'http://localhost:8000/graphql'
class NormalLoginForm extends Component {
    static contextType = AuthContext;

    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                const requestBody = {
                    query: `
                        {
                            login(email: "${values.email}", password: "${values.password}") {
                                userId
                                token
                            }
                        }
                    `
                }
                console.log('Received values of form: ', values);
                fetch(url, {
                    method: 'POST',
                    body: JSON.stringify(requestBody),
                    headers: {
                        'Content-type': 'application/json'
                    }
                })
                    .then(res => {
                        if (res.status !== 200 && res.status !== 201) {
                            throw new Error('Failed')
                        }
                        return res.json();
                    })
                    .then(resJson => {
                        const { data: { login: { token, userId } } } = resJson
                        console.log(token, userId)
                        this.context.login(token, userId)
                    })
                    .catch(err => {
                        console.error(err)
                    })
            }
        });
    }

    render() {
        const { getFieldDecorator } = this.props.form;
        return (
            <Form onSubmit={this.handleSubmit} className="login-form">
                <Form.Item>
                    {getFieldDecorator('email', {
                        rules: [{ required: true, message: 'Please input your email!' }],
                    })(
                        <Input prefix={<Icon type="mail" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Email" />
                    )}
                </Form.Item>
                <Form.Item>
                    {getFieldDecorator('password', {
                        rules: [{ required: true, message: 'Please input your Password!' }],
                    })(
                        <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="Password" />
                    )}
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" className="login-form-button">
                        Log in
                    </Button>
                    Or <Link to="/register">register now!</Link>
                </Form.Item>
            </Form>
        );
    }
}

const AuthPage = Form.create({ name: 'auth_page' })(NormalLoginForm);

export default AuthPage;