import { NextResponse } from "next/server";
import {
  getCurrentUser,
  requireClientId,
  requirePlatformStaff,
  requireRealTenantUser,
  requireTenantAccess,
  type CurrentUser,
} from "@/lib/tenant";
import { verifyWebhookSecret } from "@/lib/security";
import { HttpError } from "./errors";
import { apiError, apiFailure } from "./respond";

interface TenantScope {
  clientId: string;
  user: CurrentUser;
}

interface AuthScopes {
  public: object;
  webhook: object;
  session: { user: CurrentUser };
  tenant: TenantScope;
  provision: TenantScope;
  realTenant: TenantScope;
  staff: { user: CurrentUser };
}

export type AuthMode = keyof AuthScopes;

type RouteContext<A extends AuthMode, P> = AuthScopes[A] & { request: Request; params: P };

interface RouteOptions<A extends AuthMode> {
  auth: A;
  failure: string;
}

type Authorized = { scope: object } | { refusal: Response };

const authorizers: Record<AuthMode, (request: Request) => Promise<Authorized>> = {
  public: async () => ({ scope: {} }),
  webhook: async (request) => {
    const check = await verifyWebhookSecret(request);
    return check.isValid ? { scope: {} } : { refusal: check.response! };
  },
  session: async () => {
    const user = await getCurrentUser();
    return user ? { scope: { user } } : { refusal: apiFailure("Unauthorized", 401) };
  },
  tenant: async () => fromTenantResult(await requireClientId()),
  provision: async () => fromTenantResult(await requireTenantAccess(true)),
  realTenant: async () => fromTenantResult(await requireRealTenantUser(true)),
  staff: async () => fromTenantResult(await requirePlatformStaff()),
};

function fromTenantResult(result: { error: Response } | object): Authorized {
  return "error" in result ? { refusal: result.error } : { scope: result };
}

export function route<A extends AuthMode, P extends Record<string, string> = Record<string, never>>(
  options: RouteOptions<A>,
  handler: (ctx: RouteContext<A, P>) => Promise<unknown>
) {
  return async (request: Request, segment?: { params: Promise<P> }): Promise<Response> => {
    const authorized = await authorizers[options.auth](request);
    if ("refusal" in authorized) return authorized.refusal;

    try {
      const params = (await segment?.params) ?? ({} as P);
      const result = await handler({ ...authorized.scope, request, params } as RouteContext<A, P>);
      return result instanceof Response ? result : NextResponse.json(result);
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message, ...error.extra }, { status: error.status });
      }
      return apiError(error, options.failure);
    }
  };
}
