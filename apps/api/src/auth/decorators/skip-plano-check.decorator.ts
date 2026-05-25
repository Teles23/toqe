import { SetMetadata } from '@nestjs/common';
export const SKIP_PLANO_CHECK_KEY = 'skipPlanoCheck';
export const SkipPlanoCheck = () => SetMetadata(SKIP_PLANO_CHECK_KEY, true);
