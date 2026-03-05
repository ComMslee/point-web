import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';

@ApiTags('admin')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[관리자] 로그인 (이메일+비밀번호)' })
  @ApiResponse({ status: 200, description: '관리자 JWT 토큰 반환' })
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.adminLogin(body.email, body.password);
  }
}
