provider "aws" {
  region = "us-east-1"
}

# ==========================================
# 1. CORE STORAGE & DATABASE
# ==========================================
resource "aws_s3_bucket" "document_vault" {
  bucket        = "enterprise-compliance-vault-2026"
  force_destroy = true
}

# Required for browser-side PUT to the presigned URL.
# Restricted to localhost (local dev) + Vercel (production)
resource "aws_s3_bucket_cors_configuration" "document_vault_cors" {
  bucket = aws_s3_bucket.document_vault.id

  cors_rule {
    allowed_methods = ["GET", "HEAD", "PUT", "POST"]

    allowed_origins = [
      "http://localhost:3000",
      "https://your-app.vercel.app",
      "https://intelligent-enterprise-compliance-auditor.vercel.app"
    ]
    allowed_headers = ["content-type"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }

}


resource "aws_dynamodb_table" "audit_results" {
  name         = "ComplianceAuditLogs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "DocumentId"

  attribute {
    name = "DocumentId"
    type = "S"
  }
}

# ==========================================
# 2. IAM SECURITY ROLES FOR LAMBDA
# ==========================================
resource "aws_iam_role" "lambda_role" {
  name = "DocumentAIProcessorRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_policy" "lambda_policy" {
  name        = "DocumentAIProcessorPolicy"
  description = "Permissions for S3 extraction, presigned URL generation, and DynamoDB writing"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # S3 Permissions Split for Object and Bucket levels
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = "${aws_s3_bucket.document_vault.arn}/*" # Objects ke liye /* zaroori hai
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"] # ✓ ListBucket permissions bucket structure ke liye
        Resource = aws_s3_bucket.document_vault.arn  # Object ke bina direct bucket target
      },
      # ✓ ADDED: Textract permission block inside lambda_policy statement
      {
        Effect   = "Allow"
        Action   = ["textract:DetectDocumentText"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem"]
        Resource = aws_dynamodb_table.audit_results.arn
      },
      {
        Effect   = "Allow"
        Action   = ["lambda:InvokeFunction"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }

      
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# ==========================================
# 2b. SSM (Gemini API key)
# ==========================================
# Create this parameter in AWS SSM Parameter Store:

# Then Terraform will inject its value into the Lambda env var.
data "aws_ssm_parameter" "gemini_api_key" {
  name = "/prod/gemini/api_key"
}

# ==========================================
# 3. SERVERLESS COMPUTE (LAMBDA)
# ==========================================
resource "aws_lambda_function" "ai_processor" {
  filename         = "lambda_function.zip"
  function_name    = "DocumentAIProcessor"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "python3.11"
  source_code_hash = filebase64sha256("lambda_function.zip")
  memory_size   = 1024
  timeout       = 900
  environment {
    variables = {
      GEMINI_API_KEY = data.aws_ssm_parameter.gemini_api_key.value
    }
  }
  
}

# S3 Trigger to invoke Lambda (Precise Events Specified)
resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.document_vault.id # Explicit linking use krna safe hota hai

  lambda_function {
    lambda_function_arn = aws_lambda_function.ai_processor.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.allow_bucket]
}

resource "aws_lambda_permission" "allow_bucket" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ai_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.document_vault.arn
}

# ==========================================
# 4. API GATEWAY (FRONTEND ENTRY POINT)
# ==========================================
#resource "aws_apigatewayv2_api" "http_api" {
 # name          = "compliance-auditor-api"
  #protocol_type = "HTTP"
  
  #cors_configuration {
   # allow_origins = ["*"]
    #allow_methods = ["GET", "POST", "OPTIONS"]
    #allow_headers = ["content-type"]
  #}
#}

resource "aws_apigatewayv2_api" "http_api" {
  name          = "compliance-http-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["content-type", "authorization", "accept"]
    allow_methods = ["GET", "POST", "OPTIONS", "PUT"]
    allow_origins = [
      "http://localhost:3000",
      "https://ai-powered-enterprise-compliance-auditor-5197xg7mn.vercel.app",
      "https://intelligent-enterprise-compliance-auditor.vercel.app"
    ]
    max_age = 300
  }
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.ai_processor.arn
}

resource "aws_apigatewayv2_route" "upload_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /upload"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "results_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /results/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "agreement_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /agreement-audit"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "agreement_results_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /agreement-results/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_stage" "api_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api_gateway_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ai_processor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# ==========================================
# 5. OUTPUTS
# ==========================================
output "api_endpoint" {
  value       = aws_apigatewayv2_api.http_api.api_endpoint
  description = "Base URL for the Frontend to call"
}

