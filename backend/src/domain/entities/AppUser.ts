import type { Role } from "./Role.js";
import { roleSatisfies } from "./Role.js";

export type AppUserProps = {
  id: string;
  matricula: string;
  role: Role;
  fullName: string | null;
  active: boolean;
  createdAt: Date;
};

export class AppUser {
  readonly id: string;
  readonly matricula: string;
  readonly role: Role;
  readonly fullName: string | null;
  readonly active: boolean;
  readonly createdAt: Date;

  constructor(props: AppUserProps) {
    this.id = props.id;
    this.matricula = props.matricula;
    this.role = props.role;
    this.fullName = props.fullName;
    this.active = props.active;
    this.createdAt = props.createdAt;
  }

  hasRole(required: Role): boolean {
    return roleSatisfies(this.role, required);
  }

  toPublic() {
    return {
      id: this.id,
      matricula: this.matricula,
      role: this.role,
      fullName: this.fullName,
      active: this.active,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
