import {
  DiscordjsError as BaseDiscordjsError,
  DiscordjsTypeError as BaseDiscordjsTypeError,
  type DiscordjsError,
  type DiscordjsTypeError,
} from "discord.js";

type DiscordjsErrorConstructor = new (
  code: unknown,
  ...args: unknown[]
) => DiscordjsError;

type DiscordjsTypeErrorConstructor = new (
  code: unknown,
  ...args: unknown[]
) => DiscordjsTypeError;

export const PublicDiscordjsError =
  BaseDiscordjsError as unknown as DiscordjsErrorConstructor;

export const PublicDiscordjsTypeError =
  BaseDiscordjsTypeError as unknown as DiscordjsTypeErrorConstructor;
