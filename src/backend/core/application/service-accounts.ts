import { SubjectVO } from "@backend/core/domain/access/subject.vo";

const bootstrapServiceAccountId = "bootstrap-service-account";

/** Built-in subject for bootstrap - default data population */
export const bootstrapServiceAccount = SubjectVO.serviceAccount(bootstrapServiceAccountId);
