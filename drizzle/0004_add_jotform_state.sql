CREATE TABLE `jotform_state` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` varchar(64) NOT NULL,
	`lastSeenAt` varchar(32) NOT NULL DEFAULT '2000-01-01 00:00:00',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jotform_state_id` PRIMARY KEY(`id`),
	CONSTRAINT `jotform_state_formId_unique` UNIQUE(`formId`)
);
