import { TenantInterceptor } from './tenant.interceptor';
import { TenantContextService } from '../tenant-context/tenant-context.service';

describe('TenantInterceptor', () => {
  it('should be defined', () => {
    const mockCtx = {} as TenantContextService;
    expect(new TenantInterceptor(mockCtx)).toBeDefined();
  });
});
