import { Test, TestingModuleBuilder } from '@nestjs/testing';

export class TestUtilities {
  static createTestModule(moduleMetadata: any): TestingModuleBuilder {
    return Test.createTestingModule(moduleMetadata);
  }
}
