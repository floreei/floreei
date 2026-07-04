import { Injectable } from "@nestjs/common";
import type {
  CustomerInput,
  CustomerQuery,
  Paginated,
} from "@sistema-flores/types";
import { CustomerEntity } from "../infrastructure/customer.entity";
import { CustomerRepository } from "../infrastructure/customer.repository";

@Injectable()
export class CustomersService {
  constructor(private readonly customers: CustomerRepository) {}

  list(query: CustomerQuery): Promise<Paginated<CustomerEntity>> {
    return this.customers.search(query);
  }

  findOne(id: string): Promise<CustomerEntity> {
    return this.customers.findByIdOrFail(id);
  }

  create(input: CustomerInput): Promise<CustomerEntity> {
    return this.customers.save(this.customers.create(input));
  }

  async update(id: string, input: CustomerInput): Promise<CustomerEntity> {
    const customer = await this.customers.findByIdOrFail(id);
    Object.assign(customer, input);
    return this.customers.save(customer);
  }

  remove(id: string): Promise<void> {
    return this.customers.deleteById(id);
  }
}
