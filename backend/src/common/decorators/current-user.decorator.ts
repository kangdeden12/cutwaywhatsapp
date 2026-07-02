import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Pakai lewat: getProfile(@CurrentUser() user) di controller yang dilindungi JwtAuthGuard.
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
