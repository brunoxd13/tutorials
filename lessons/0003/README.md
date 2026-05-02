# Deploying Lambdas on AWS using GitHub Actions

- [YouTube Video](https://youtu.be/5kn4JBvimSA?si=uLy4QWvaQGESpe3E)


Este repositório demonstra como realizar **deploy de funções AWS Lambda** via **GitHub Actions** usando **OpenID Connect (OIDC)** — sem armazenar chaves de acesso.


## 🧭 Visão geral

- 🔐 Autenticação segura com **OIDC** (sem `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`).
- 🔄 Deploy automatizado com a **nova action oficial** [aws-actions/aws-lambda-deploy@v1.1.0](https://github.com/aws-actions/aws-lambda-deploy).

## ⚙️ 1. Configurar o IAM para confiar no GitHub (OIDC)

No Console da AWS:

> **IAM → Identity providers → Add provider**

- **Provider type:** `OpenID Connect`
- **Provider URL:** `https://token.actions.githubusercontent.com`
- **Audience:** `sts.amazonaws.com`

Ou via AWS CLI:

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com
```

## 2. Criar a role de **deploy** (assumida pelo GitHub Actions via OIDC)

### 2.1 Trust policy

Substitua:

- `123456789012` -> seu ID da conta AWS
- `your-org/your-repo` -> seu repositório GitHub

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:your-org/your-repo:*"
        }
      }
    }
  ]
}
```

### 2.2 Permissões mínimas para deploy

Essa policy permite **criar e atualizar** funções Lambda e **publicar versões**.

Substitua `<region>`, `<aws_account_id>`, `<function_name>` e `<function_execution_role_name>` conforme sua conta.
```json
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "LambdaDeployPermissions",
          "Effect": "Allow",
          "Action": [
            "lambda:GetFunction",
            "lambda:GetFunctionConfiguration",
            "lambda:CreateFunction",
            "lambda:UpdateFunctionCode",
            "lambda:UpdateFunctionConfiguration",
            "lambda:PublishVersion",
            "lambda:TagResource",
            "lambda:UntagResource"
          ],
          "Resource": "arn:aws:lambda:<region>:<aws_account_id>:function:<function_name>"
        },
        {
          "Sid": "IamPassRoleForLambda",
          "Effect": "Allow",
          "Action": "iam:PassRole",
          "Resource": "arn:aws:iam::<aws_account_id>:role/<function_execution_role_name>",
          "Condition": {
            "StringEquals": {
              "iam:PassedToService": "lambda.amazonaws.com"
            }
          }
        },
        {
          "Sid": "LogsReadWriteBasic",
          "Effect": "Allow",
          "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "logs:DescribeLogStreams"
          ],
          "Resource": "*"
        }
      ]
    }
```

## 3. Criar a role de **execução** da Lambda (runtime role)

Essa role é **associada à própria função Lambda**, não ao Actions.

- **Trust policy:**
```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": { "Service": "lambda.amazonaws.com" },
        "Action": "sts:AssumeRole"
      }
    ]
  }
```

- **Permissions:**
  Anexe a policy gerenciada: `arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole`


## ⚡ 5. Configurar o GitHub Actions (OIDC + nova action)

Em **Settings → Secrets and variables → Actions**:

### 🔒 Secrets

- `DEPLOY_ROLE_ARN` -> ARN da role de deploy


## 6. Criar o código das Lambdas

## 7. Testar o deploy

1. Faça um commit alterando qualquer arquivo dentro de `lambdas/**`.
2. O GitHub Actions detectará quais funções foram modificadas.
3. Será feito o deploy automático das funções correspondentes para a AWS.

## 🧠 Recursos úteis

- [aws-actions/aws-lambda-deploy](https://github.com/aws-actions/aws-lambda-deploy)
- [aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials)
- [Documentação AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
