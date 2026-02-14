CREATE TABLE `agenda` (
	`id` int AUTO_INCREMENT NOT NULL,
	`data` text NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agenda_id` PRIMARY KEY(`id`)
);
