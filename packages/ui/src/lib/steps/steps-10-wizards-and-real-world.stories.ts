import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, inject, signal } from '@angular/core';
import { provideLocationMocks } from '@angular/common/testing';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ActivatedRoute,
  NavigationEnd,
  provideRouter,
  Router,
  RouterOutlet,
} from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { filter, map } from 'rxjs';

import {
  about,
  FOUR,
  muted,
  resizable,
  StepsDemo,
  withDescription,
  withStepsKit,
} from '../../testing/steps-story-kit';
import { AndesButton } from '../button/button';
import { AndesCheckbox } from '../checkbox/checkbox';
import { ANDES_DIALOG_IMPORTS } from '../dialog/dialog';
import { AndesForm } from '../form-field/form';
import { AndesFormField } from '../form-field/form-field';
import { AndesInput } from '../input/input';
import { AndesSelect } from '../select/select';
import { AndesSwitch } from '../switch/switch';
import { AndesTag } from '../tag/tag';
import { AndesStep } from './step';
import { AndesStepPanel } from './step-panel';
import { AndesSteps } from './steps';

const PANEL_STYLE = 'display: block; padding-block: 1.5rem;';

/** Back and Next under a trail whose panels hold the content of each step. */
@Component({
  selector: 'andes-steps-basic-wizard',
  imports: [AndesSteps, AndesStep, AndesStepPanel, AndesButton],
  template: `
    <andes-steps #trail aria-label="Sign up" [(current)]="step">
      <andes-step title="Account" description="Your login" />
      <andes-step title="Profile" description="About you" />
      <andes-step title="Finish" description="All set" />
      <andes-step-panel [style]="panel"
        ><p [style]="muted">
          Choose an email and a password.
        </p></andes-step-panel
      >
      <andes-step-panel [style]="panel"
        ><p [style]="muted">
          Tell us your name and where you work.
        </p></andes-step-panel
      >
      <andes-step-panel [style]="panel"
        ><p [style]="muted">
          Everything is ready. Welcome aboard.
        </p></andes-step-panel
      >
    </andes-steps>
    <div [style]="bar">
      <andes-button
        variant="outline"
        [disabled]="step() === 0"
        (click)="trail.previous()"
        >Back</andes-button
      >
      @if (step() < 2) {
        <andes-button (click)="trail.next()">Next</andes-button>
      } @else {
        <andes-button (click)="step.set(0)">Start again</andes-button>
      }
    </div>
  `,
})
class BasicWizard extends StepsDemo {
  protected readonly panel = PANEL_STYLE;
}

/** The first step has to be valid before the trail moves on. */
@Component({
  selector: 'andes-steps-validated-wizard',
  imports: [
    AndesSteps,
    AndesStep,
    AndesStepPanel,
    AndesButton,
    AndesInput,
    AndesForm,
    AndesFormField,
    ReactiveFormsModule,
  ],
  template: `
    <andes-steps
      aria-label="Sign up"
      [status]="failed() ? 'error' : 'process'"
      [(current)]="step"
    >
      <andes-step
        title="Account"
        [description]="failed() ? 'Fix the highlighted fields' : 'Your login'"
      />
      <andes-step title="Confirm" description="Check it" />
      <andes-step-panel [style]="panel">
        <form
          andesForm
          [formGroup]="account"
          layout="vertical"
          style="max-width: 22rem"
        >
          <andes-form-field label="Name"
            ><andes-input formControlName="name"
          /></andes-form-field>
          <andes-form-field label="Email"
            ><andes-input formControlName="email" type="email"
          /></andes-form-field>
        </form>
      </andes-step-panel>
      <andes-step-panel [style]="panel">
        <p [style]="muted">
          Welcome, {{ account.value.name }}. We sent a message to
          {{ account.value.email }}.
        </p>
      </andes-step-panel>
    </andes-steps>
    <div [style]="bar">
      <andes-button
        variant="outline"
        [disabled]="step() === 0"
        (click)="step.set(0)"
        >Back</andes-button
      >
      <andes-button [disabled]="step() === 1" (click)="next()"
        >Next</andes-button
      >
    </div>
  `,
})
class ValidatedWizard extends StepsDemo {
  protected readonly panel = PANEL_STYLE;
  protected readonly failed = signal(false);
  protected readonly account = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  protected next(): void {
    if (this.account.invalid) {
      this.account.markAllAsTouched();
      this.failed.set(true);
      return;
    }
    this.failed.set(false);
    this.step.set(1);
  }
}

/** The next button waits for a check that takes a moment, and an address that is taken fails it. */
@Component({
  selector: 'andes-steps-async-wizard',
  imports: [
    AndesSteps,
    AndesStep,
    AndesStepPanel,
    AndesButton,
    AndesInput,
    AndesForm,
    AndesFormField,
    ReactiveFormsModule,
  ],
  template: `
    <andes-steps
      aria-label="Pick a username"
      [status]="problem() ? 'error' : 'process'"
      [(current)]="step"
    >
      <andes-step
        title="Username"
        [description]="problem() || 'Must be available'"
      />
      <andes-step title="Password" />
      <andes-step title="Done" />
      <andes-step-panel [style]="panel">
        <form
          andesForm
          [formGroup]="form"
          layout="vertical"
          style="max-width: 22rem"
        >
          <andes-form-field label="Username" help="Try the name taken">
            <andes-input formControlName="username" />
          </andes-form-field>
        </form>
      </andes-step-panel>
      <andes-step-panel [style]="panel"
        ><p [style]="muted">
          Now choose a password for {{ form.value.username }}.
        </p></andes-step-panel
      >
      <andes-step-panel [style]="panel"
        ><p [style]="muted">The account is ready.</p></andes-step-panel
      >
    </andes-steps>
    <div [style]="bar">
      <andes-button
        variant="outline"
        [disabled]="step() === 0 || checking()"
        (click)="step.set(step() - 1)"
        >Back</andes-button
      >
      <andes-button
        [loading]="checking()"
        [disabled]="step() === 2"
        (click)="next()"
        >{{ step() === 0 ? 'Check and continue' : 'Next' }}</andes-button
      >
    </div>
  `,
})
class AsyncWizard extends StepsDemo {
  protected readonly panel = PANEL_STYLE;
  protected readonly checking = signal(false);
  protected readonly problem = signal('');
  protected readonly form = new FormGroup({
    username: new FormControl('lucia', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected next(): void {
    if (this.step() !== 0) {
      this.step.update((value) => value + 1);
      return;
    }
    this.checking.set(true);
    this.problem.set('');
    setTimeout(() => {
      this.checking.set(false);
      if (this.form.value.username === 'taken') {
        this.problem.set('That username is taken');
        return;
      }
      this.step.set(1);
    }, 700);
  }
}

/** A review step that summarises the answers and links back to the step that holds each one. */
@Component({
  selector: 'andes-steps-review-wizard',
  imports: [
    AndesSteps,
    AndesStep,
    AndesStepPanel,
    AndesButton,
    AndesInput,
    AndesSelect,
    AndesTag,
    AndesForm,
    AndesFormField,
    ReactiveFormsModule,
  ],
  template: `
    <andes-steps aria-label="Book a room" [(current)]="step">
      <andes-step title="Guest" />
      <andes-step title="Room" />
      <andes-step title="Review" />
      <andes-step title="Done" />
      <andes-step-panel [style]="panel">
        <form
          andesForm
          [formGroup]="form"
          layout="vertical"
          style="max-width: 22rem"
        >
          <andes-form-field label="Guest name"
            ><andes-input formControlName="guest"
          /></andes-form-field>
        </form>
      </andes-step-panel>
      <andes-step-panel [style]="panel">
        <form
          andesForm
          [formGroup]="form"
          layout="vertical"
          style="max-width: 22rem"
        >
          <andes-form-field label="Room"
            ><andes-select formControlName="room" [options]="rooms"
          /></andes-form-field>
        </form>
      </andes-step-panel>
      <andes-step-panel [style]="panel">
        <dl
          style="display: grid; grid-template-columns: max-content 1fr max-content; gap: 0.75rem 1.5rem; align-items: center; margin: 0; max-width: 28rem"
        >
          <dt [style]="muted">Guest</dt>
          <dd style="margin: 0">{{ form.value.guest }}</dd>
          <andes-button variant="link" size="sm" (click)="step.set(0)"
            >Edit</andes-button
          >
          <dt [style]="muted">Room</dt>
          <dd style="margin: 0">{{ form.value.room }}</dd>
          <andes-button variant="link" size="sm" (click)="step.set(1)"
            >Edit</andes-button
          >
        </dl>
      </andes-step-panel>
      <andes-step-panel [style]="panel">
        <andes-tag color="success">Booked</andes-tag>
        <p [style]="muted">A confirmation went to {{ form.value.guest }}.</p>
      </andes-step-panel>
    </andes-steps>
    <div [style]="bar">
      <andes-button
        variant="outline"
        [disabled]="step() === 0 || step() === 3"
        (click)="step.set(step() - 1)"
        >Back</andes-button
      >
      @if (step() < 2) {
        <andes-button (click)="step.set(step() + 1)">Next</andes-button>
      } @else if (step() === 2) {
        <andes-button (click)="step.set(3)">Confirm booking</andes-button>
      } @else {
        <andes-button variant="outline" (click)="step.set(0)"
          >New booking</andes-button
        >
      }
    </div>
  `,
})
class ReviewWizard extends StepsDemo {
  protected readonly panel = PANEL_STYLE;
  protected readonly rooms = [
    { value: 'Single', label: 'Single' },
    { value: 'Double', label: 'Double' },
    { value: 'Suite', label: 'Suite' },
  ];
  protected readonly form = new FormGroup({
    guest: new FormControl('Lucia Paredes', { nonNullable: true }),
    room: new FormControl('Double', { nonNullable: true }),
  });
}

/** The steps that follow depend on the answer to the first one, and one of them can be skipped. */
@Component({
  selector: 'andes-steps-branch-wizard',
  imports: [AndesSteps, AndesStep, AndesStepPanel, AndesButton, AndesSwitch],
  template: `
    <andes-steps #trail aria-label="Create an account" [(current)]="step">
      @for (item of items(); track item.id) {
        <andes-step
          [title]="item.title"
          [optional]="item.optional"
          [status]="skipped() && item.id === 'invite' ? 'finish' : undefined"
          [subtitle]="skipped() && item.id === 'invite' ? 'Skipped' : undefined"
        />
      }
      @for (item of items(); track item.id) {
        <andes-step-panel [style]="panel">
          <p [style]="muted">{{ item.text }}</p>
          @if (item.id === 'kind') {
            <andes-switch [(checked)]="business"
              >This is a business account</andes-switch
            >
          }
          @if (item.id === 'invite') {
            <andes-button variant="outline" (click)="skip(trail)"
              >Skip for now</andes-button
            >
          }
        </andes-step-panel>
      }
    </andes-steps>
    <div [style]="bar">
      <andes-button
        variant="outline"
        [disabled]="step() === 0"
        (click)="trail.previous()"
        >Back</andes-button
      >
      <andes-button
        [disabled]="step() === items().length - 1"
        (click)="trail.next()"
        >Next</andes-button
      >
    </div>
  `,
})
class BranchWizard extends StepsDemo {
  protected readonly panel = PANEL_STYLE;
  protected readonly business = signal(false);
  protected readonly skipped = signal(false);
  protected readonly items = computed(() => {
    const common = [
      {
        id: 'kind',
        title: 'Account type',
        text: 'Is this for you or for a company?',
        optional: false,
      },
    ];
    const details = this.business()
      ? [
          {
            id: 'company',
            title: 'Company',
            text: 'Legal name and tax id.',
            optional: false,
          },
          {
            id: 'billing',
            title: 'Billing',
            text: 'Where the invoices go.',
            optional: false,
          },
        ]
      : [
          {
            id: 'profile',
            title: 'Profile',
            text: 'Your name and photo.',
            optional: false,
          },
        ];
    return [
      ...common,
      ...details,
      {
        id: 'invite',
        title: 'Invite people',
        text: 'Add your team.',
        optional: true,
      },
      { id: 'done', title: 'Done', text: 'You are all set.', optional: false },
    ];
  });

  protected skip(trail: AndesSteps): void {
    this.skipped.set(true);
    trail.next();
  }
}

/** A form split over three steps: each step owns a group, and a group that fails marks its step. */
@Component({
  selector: 'andes-steps-form-wizard',
  imports: [
    AndesSteps,
    AndesStep,
    AndesStepPanel,
    AndesButton,
    AndesInput,
    AndesSelect,
    AndesForm,
    AndesFormField,
    ReactiveFormsModule,
  ],
  template: `
    <andes-steps
      aria-label="Registration form"
      clickable
      [beforeChange]="canLeave"
      [(current)]="step"
    >
      @for (group of groups; track group.title; let i = $index) {
        <andes-step
          [title]="group.title"
          [status]="
            group.form.touched && group.form.invalid ? 'error' : undefined
          "
          [description]="
            group.form.touched && group.form.invalid
              ? 'Needs attention'
              : group.hint
          "
        />
      }
      <andes-step-panel [style]="panel">
        <form
          andesForm
          [formGroup]="person"
          layout="vertical"
          style="max-width: 22rem"
        >
          <andes-form-field label="Full name"
            ><andes-input formControlName="name"
          /></andes-form-field>
          <andes-form-field label="Email"
            ><andes-input formControlName="email" type="email"
          /></andes-form-field>
        </form>
      </andes-step-panel>
      <andes-step-panel [style]="panel">
        <form
          andesForm
          [formGroup]="place"
          layout="vertical"
          style="max-width: 22rem"
        >
          <andes-form-field label="Street"
            ><andes-input formControlName="street"
          /></andes-form-field>
          <andes-form-field label="City"
            ><andes-select
              formControlName="city"
              [options]="cities"
              placeholder="Choose a city"
          /></andes-form-field>
        </form>
      </andes-step-panel>
      <andes-step-panel [style]="panel">
        <p [style]="muted">
          Everything is valid. Press Submit to send the form.
        </p>
      </andes-step-panel>
    </andes-steps>
    <div [style]="bar">
      <andes-button
        variant="outline"
        [disabled]="step() === 0"
        (click)="step.set(step() - 1)"
        >Back</andes-button
      >
      @if (step() < 2) {
        <andes-button (click)="advance()">Next</andes-button>
      } @else {
        <andes-button (click)="submit()">Submit</andes-button>
      }
    </div>
    <p [style]="readout + ' margin-block-start: 1rem'">{{ message() }}</p>
  `,
})
class FormWizard extends StepsDemo {
  protected readonly panel = PANEL_STYLE;
  protected readonly message = signal('');
  protected readonly cities = [
    { value: 'Lima', label: 'Lima' },
    { value: 'Cusco', label: 'Cusco' },
  ];
  protected readonly person = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });
  protected readonly place = new FormGroup({
    street: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    city: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
  protected readonly groups = [
    { title: 'Person', hint: 'Name and email', form: this.person },
    { title: 'Place', hint: 'Where you live', form: this.place },
    { title: 'Submit', hint: 'Send it', form: new FormGroup({}) },
  ];

  /** Going back is always allowed; going forward needs the steps before the target to be valid. */
  protected readonly canLeave = (to: number, from: number): boolean => {
    if (to < from) {
      return true;
    }
    const blocking = this.groups
      .slice(from, to)
      .find((group) => group.form.invalid);
    if (blocking) {
      blocking.form.markAllAsTouched();
      this.message.set(`Complete "${blocking.title}" first`);
    }
    return !blocking;
  };

  protected advance(): void {
    if (this.canLeave(this.step() + 1, this.step())) {
      this.step.update((value) => value + 1);
      this.message.set('');
    }
  }

  protected submit(): void {
    this.message.set('Submitted');
  }
}

/** A route page: its text comes from the route's data. */
@Component({
  selector: 'andes-steps-route-page',
  template: `<p [style]="muted">{{ text }}</p>`,
})
class RoutePage {
  protected readonly muted = muted;
  protected readonly text = inject(ActivatedRoute).snapshot.data['text'];
}

const ROUTES = [
  {
    path: 'account',
    component: RoutePage,
    data: { text: 'The account page is at /account.' },
  },
  {
    path: 'address',
    component: RoutePage,
    data: { text: 'The address page is at /address.' },
  },
  {
    path: 'payment',
    component: RoutePage,
    data: { text: 'The payment page is at /payment.' },
  },
];

/** A trail whose current step is the route, and whose clicks navigate. */
@Component({
  selector: 'andes-steps-router',
  imports: [AndesSteps, AndesStep, RouterOutlet],
  template: `
    <andes-steps
      aria-label="Checkout route"
      clickable
      [current]="step()"
      (changed)="go($event)"
    >
      <andes-step title="Account" description="/account" />
      <andes-step title="Address" description="/address" />
      <andes-step title="Payment" description="/payment" />
    </andes-steps>
    <div style="padding-block: 1.5rem"><router-outlet /></div>
    <p [style]="muted">URL: {{ url() }}</p>
  `,
})
class RouterDemo {
  private readonly router = inject(Router);
  protected readonly muted = muted;
  protected readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: '' },
  );
  protected readonly step = computed(() =>
    ROUTES.findIndex((route) => this.url().endsWith(`/${route.path}`)),
  );

  constructor() {
    void this.router.navigateByUrl('/account');
  }

  protected go(index: number): void {
    void this.router.navigateByUrl(`/${ROUTES[index].path}`);
  }
}

/** A checkout with the order summary beside the panels. */
@Component({
  selector: 'andes-steps-checkout',
  imports: [
    AndesSteps,
    AndesStep,
    AndesStepPanel,
    AndesButton,
    AndesInput,
    AndesSelect,
    AndesCheckbox,
    AndesForm,
    AndesFormField,
    ReactiveFormsModule,
  ],
  template: `
    <div
      style="display: grid; grid-template-columns: minmax(0, 1fr) 16rem; gap: 2rem; align-items: start"
    >
      <div>
        <andes-steps #trail aria-label="Checkout" [(current)]="step">
          <andes-step title="Cart" icon="lucideBox" />
          <andes-step title="Shipping" icon="lucideTruck" />
          <andes-step title="Payment" icon="lucideCreditCard" />
          <andes-step title="Confirm" icon="lucideBadgeCheck" />
          <andes-step-panel [style]="panel"
            ><p [style]="muted">
              Two items are in your cart. Review them and continue.
            </p></andes-step-panel
          >
          <andes-step-panel [style]="panel">
            <form andesForm [formGroup]="form" layout="vertical">
              <andes-form-field label="Address"
                ><andes-input formControlName="address"
              /></andes-form-field>
              <andes-form-field label="Delivery"
                ><andes-select formControlName="delivery" [options]="options"
              /></andes-form-field>
            </form>
          </andes-step-panel>
          <andes-step-panel [style]="panel">
            <form andesForm [formGroup]="form" layout="vertical">
              <andes-form-field label="Card number"
                ><andes-input formControlName="card"
              /></andes-form-field>
              <andes-checkbox formControlName="save"
                >Save this card</andes-checkbox
              >
            </form>
          </andes-step-panel>
          <andes-step-panel [style]="panel"
            ><p [style]="muted">
              Your order is placed. We sent the receipt by email.
            </p></andes-step-panel
          >
        </andes-steps>
        <div [style]="bar">
          <andes-button
            variant="outline"
            [disabled]="step() === 0 || step() === 3"
            (click)="trail.previous()"
            >Back</andes-button
          >
          <andes-button [disabled]="step() === 3" (click)="trail.next()">{{
            step() === 2 ? 'Pay now' : 'Continue'
          }}</andes-button>
        </div>
      </div>
      <aside [style]="surface">
        <p style="margin: 0 0 0.75rem; font-weight: 600">Order summary</p>
        <div style="display: flex; justify-content: space-between;">
          <span [style]="muted">Desk lamp</span><span>S/ 89.00</span>
        </div>
        <div
          style="display: flex; justify-content: space-between; margin-block-start: 0.5rem"
        >
          <span [style]="muted">Notebook</span><span>S/ 24.50</span>
        </div>
        <div
          style="display: flex; justify-content: space-between; margin-block-start: 0.75rem; padding-block-start: 0.75rem; border-top: 1px solid var(--andes-color-border); font-weight: 600"
        >
          <span>Total</span><span>S/ 113.50</span>
        </div>
      </aside>
    </div>
  `,
})
class CheckoutDemo extends StepsDemo {
  protected readonly panel = PANEL_STYLE;
  protected readonly options = [
    { value: 'standard', label: 'Standard, 3 days' },
    { value: 'express', label: 'Express, next day' },
  ];
  protected readonly form = new FormGroup({
    address: new FormControl('Av. Arequipa 1234, Lima', { nonNullable: true }),
    delivery: new FormControl('standard', { nonNullable: true }),
    card: new FormControl('4242 4242 4242 4242', { nonNullable: true }),
    save: new FormControl(false, { nonNullable: true }),
  });
}

/** An onboarding checklist: stacked steps with an action inside the step in progress. */
@Component({
  selector: 'andes-steps-onboarding',
  imports: [AndesSteps, AndesStep, AndesButton, AndesTag],
  template: `
    <div [style]="surface + ' max-width: 34rem'">
      <div
        style="display: flex; align-items: center; justify-content: space-between; margin-block-end: 1.5rem"
      >
        <div>
          <p style="margin: 0; font-weight: 600">Get started</p>
          <p [style]="muted + ' margin: 0'">
            {{ step() }} of 4 tasks completed
          </p>
        </div>
        <andes-tag [color]="step() === 4 ? 'success' : 'info'">{{
          step() === 4 ? 'All done' : 'In progress'
        }}</andes-tag>
      </div>
      <andes-steps
        aria-label="Onboarding"
        orientation="vertical"
        [(current)]="step"
      >
        <andes-step
          title="Create a workspace"
          description="Name it and choose a region."
        >
          @if (step() === 0) {
            <andes-button size="sm" (click)="step.set(1)"
              >Create workspace</andes-button
            >
          }
        </andes-step>
        <andes-step
          title="Invite your team"
          description="Teammates join with a link."
        >
          @if (step() === 1) {
            <andes-button size="sm" (click)="step.set(2)"
              >Copy invite link</andes-button
            >
          }
        </andes-step>
        <andes-step
          title="Connect a data source"
          description="Import customers and orders."
        >
          @if (step() === 2) {
            <andes-button size="sm" (click)="step.set(3)">Connect</andes-button>
          }
        </andes-step>
        <andes-step title="Go live" description="Publish your first dashboard.">
          @if (step() === 3) {
            <andes-button size="sm" (click)="step.set(4)">Publish</andes-button>
          }
        </andes-step>
      </andes-steps>
      <div [style]="bar + ' margin-block-start: 1.5rem'">
        <andes-button variant="ghost" size="sm" (click)="step.set(0)"
          >Start over</andes-button
        >
      </div>
    </div>
  `,
})
class OnboardingDemo extends StepsDemo {}

/** A sidebar of steps with the content of the selected one beside it. */
@Component({
  selector: 'andes-steps-sidebar',
  imports: [AndesSteps, AndesStep, AndesStepPanel],
  template: `
    <andes-steps
      aria-label="Settings"
      orientation="vertical"
      size="small"
      clickable
      [styles]="layout"
      [responsive]="false"
      [(current)]="step"
    >
      <andes-step title="Profile" description="Name and photo" />
      <andes-step title="Notifications" description="Email and push" />
      <andes-step title="Security" description="Password and codes" />
      <andes-step title="Billing" description="Plan and invoices" />
      <andes-step-panel [style]="pane"
        ><p [style]="muted">
          Update your name, photo and public details.
        </p></andes-step-panel
      >
      <andes-step-panel [style]="pane"
        ><p [style]="muted">
          Choose what we email and what we push.
        </p></andes-step-panel
      >
      <andes-step-panel [style]="pane"
        ><p [style]="muted">
          Change your password and manage two-step codes.
        </p></andes-step-panel
      >
      <andes-step-panel [style]="pane"
        ><p [style]="muted">
          See your plan and download invoices.
        </p></andes-step-panel
      >
    </andes-steps>
  `,
})
class SidebarDemo extends StepsDemo {
  protected readonly layout = {
    root: {
      display: 'grid',
      gridTemplateColumns: '14rem minmax(0, 1fr)',
      gap: '2rem',
      padding: '1.5rem',
      border: '1px solid var(--andes-color-border)',
      borderRadius: '0.75rem',
    },
  };
  protected readonly pane =
    'display: block; padding-inline-start: 2rem; border-inline-start: 1px solid var(--andes-color-border);';
}

/** A wizard inside a dialog. */
@Component({
  selector: 'andes-steps-dialog',
  imports: [
    AndesSteps,
    AndesStep,
    AndesStepPanel,
    AndesButton,
    ANDES_DIALOG_IMPORTS,
  ],
  template: `
    <andes-dialog>
      <andes-button andesDialogTrigger>Invite people</andes-button>
      <andes-dialog-content *andesDialogContent>
        <div andesDialogHeader>
          <h2 andesDialogTitle>Invite people</h2>
          <p andesDialogDescription>Add teammates in three short steps.</p>
        </div>
        <andes-steps #trail aria-label="Invite" size="small" [(current)]="step">
          <andes-step title="Who" />
          <andes-step title="Role" />
          <andes-step title="Send" />
          <andes-step-panel [style]="panel"
            ><p [style]="muted">
              Enter one or more email addresses.
            </p></andes-step-panel
          >
          <andes-step-panel [style]="panel"
            ><p [style]="muted">Choose what they can do.</p></andes-step-panel
          >
          <andes-step-panel [style]="panel"
            ><p [style]="muted">
              Check the list and send the invitations.
            </p></andes-step-panel
          >
        </andes-steps>
        <div andesDialogFooter>
          <andes-button
            variant="secondary"
            [disabled]="step() === 0"
            (click)="trail.previous()"
            >Back</andes-button
          >
          @if (step() < 2) {
            <andes-button (click)="trail.next()">Next</andes-button>
          } @else {
            <andes-button andesDialogClose>Send invitations</andes-button>
          }
        </div>
      </andes-dialog-content>
    </andes-dialog>
  `,
})
class DialogDemo extends StepsDemo {
  protected readonly panel = PANEL_STYLE;
}

/** A card with the trail in its header and the actions in its footer. */
@Component({
  selector: 'andes-steps-card',
  imports: [AndesSteps, AndesStep, AndesStepPanel, AndesButton],
  template: `
    <div
      style="max-width: 34rem; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); background: var(--andes-color-card); overflow: hidden"
    >
      <div
        style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--andes-color-border)"
      >
        <p style="margin: 0 0 1rem; font-weight: 600">Import customers</p>
        <andes-steps #trail aria-label="Import" size="small" [(current)]="step">
          <andes-step title="Upload" />
          <andes-step title="Map" />
          <andes-step title="Import" />
          <andes-step-panel [style]="panel"
            ><p [style]="muted">
              Drop a csv file with your customers.
            </p></andes-step-panel
          >
          <andes-step-panel [style]="panel"
            ><p [style]="muted">
              Match each column to a field.
            </p></andes-step-panel
          >
          <andes-step-panel [style]="panel"
            ><p [style]="muted">
              1,204 customers are ready to import.
            </p></andes-step-panel
          >
        </andes-steps>
      </div>
      <div
        style="display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; background: var(--andes-color-muted)"
      >
        <andes-button
          variant="outline"
          [disabled]="step() === 0"
          (click)="trail.previous()"
          >Back</andes-button
        >
        <andes-button [disabled]="step() === 2" (click)="trail.next()"
          >Continue</andes-button
        >
      </div>
    </div>
  `,
})
class CardDemo extends StepsDemo {
  protected readonly panel = 'display: block; padding-block: 1.25rem 0;';
}

/** A step that failed, with a retry inside it. */
@Component({
  selector: 'andes-steps-retry',
  imports: [AndesSteps, AndesStep, AndesButton],
  template: `
    <andes-steps
      aria-label="Publishing"
      orientation="vertical"
      [status]="failed() ? 'error' : 'process'"
      [current]="step()"
      style="max-width: 30rem"
    >
      <andes-step title="Build" description="Compiled in 42 seconds" />
      <andes-step
        title="Upload"
        [description]="
          failed() ? 'The connection was reset at 63%' : 'Sending the package'
        "
        [percent]="failed() ? 63 : 100"
      >
        @if (failed()) {
          <andes-button
            size="sm"
            variant="outline"
            (click)="failed.set(false); step.set(2)"
            >Retry upload</andes-button
          >
        }
      </andes-step>
      <andes-step title="Publish" description="Make it public" />
    </andes-steps>
    <div [style]="bar + ' margin-block-start: 1.5rem'">
      <andes-button
        variant="ghost"
        size="sm"
        (click)="failed.set(true); step.set(1)"
        >Make it fail again</andes-button
      >
    </div>
  `,
})
class RetryDemo extends StepsDemo {
  protected readonly failed = signal(true);

  constructor() {
    super();
    this.step.set(1);
  }
}

const meta: Meta<AndesSteps> = {
  title: 'Navigation/Steps/Wizards and real world',
  component: AndesSteps,
  tags: ['autodocs'],
  decorators: [
    withDescription,
    withStepsKit,
    moduleMetadata({
      imports: [
        AndesSteps,
        AndesStep,
        AndesStepPanel,
        AndesButton,
        NgIcon,
        BasicWizard,
        ValidatedWizard,
        AsyncWizard,
        ReviewWizard,
        BranchWizard,
        CheckoutDemo,
        OnboardingDemo,
        SidebarDemo,
        DialogDemo,
        CardDemo,
        RetryDemo,
        FormWizard,
      ],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesSteps>;

export const Wizard: Story = {
  name: 'Wizard with content',
  parameters: about(
    'A panel for each step shows the content of the step in progress, and the buttons call next and previous on the trail.',
  ),
  render: () => ({ template: `<andes-steps-basic-wizard />` }),
};

export const ValidationBlocks: Story = {
  name: 'Validation blocks the next step',
  parameters: about(
    'Next stays on the first step while its form is invalid, and the step turns red with a hint until the fields are fixed.',
  ),
  render: () => ({ template: `<andes-steps-validated-wizard />` }),
};

export const AsyncValidation: Story = {
  name: 'Checking a step on the server',
  parameters: about(
    'A check that takes a moment keeps the button loading, then moves on, or marks the step as failed when the answer is no.',
  ),
  render: () => ({ template: `<andes-steps-async-wizard />` }),
};

export const ReviewAndDone: Story = {
  name: 'Review and done steps',
  parameters: about(
    'A review step summarises the answers with a link back to each one, and a done step closes the flow with a confirmation.',
  ),
  render: () => ({ template: `<andes-steps-review-wizard />` }),
};

export const Branching: Story = {
  name: 'Branches and skipped steps',
  parameters: about(
    'The steps come from data, so the answer to the first one changes the ones after it, and an optional step can be skipped.',
  ),
  render: () => ({ template: `<andes-steps-branch-wizard />` }),
};

export const FormWizardStory: Story = {
  name: 'A form split into steps',
  parameters: about(
    'Each step owns a group of fields, a step whose group fails turns red, and the trail only lets the user move past a step once it is valid.',
  ),
  render: () => ({ template: `<andes-steps-form-wizard />` }),
};

export const Routed: Story = {
  name: 'Bound to the router',
  parameters: about(
    'The current step is read from the route and a click navigates, so the browser history and the trail always agree.',
  ),
  decorators: [
    moduleMetadata({ imports: [RouterDemo] }),
    applicationConfig({
      providers: [provideRouter(ROUTES), provideLocationMocks()],
    }),
  ],
  render: () => ({ template: `<andes-steps-router />` }),
};

export const Checkout: Story = {
  name: 'Checkout',
  parameters: about(
    'A checkout with icons in the markers, a form in each panel and the order summary beside them.',
  ),
  render: () => ({ template: `<andes-steps-checkout />` }),
};

export const Onboarding: Story = {
  name: 'Onboarding checklist',
  parameters: about(
    'A stacked trail where the step in progress shows its own action, with a counter and a tag above it.',
  ),
  render: () => ({ template: `<andes-steps-onboarding />` }),
};

export const SidebarSteps: Story = {
  name: 'Side panel of steps',
  parameters: about(
    'The root style turns the trail into two columns, a small stacked list on the start side and the selected panel beside it.',
  ),
  render: () => ({ template: `<andes-steps-sidebar />` }),
};

export const InDialog: Story = {
  name: 'Inside a dialog',
  parameters: about(
    'A small trail under the heading of a dialog, with the back and next buttons in the dialog footer.',
  ),
  render: () => ({ template: `<andes-steps-dialog />` }),
};

export const InCard: Story = {
  name: 'Inside a card',
  parameters: about(
    'A small trail in the header of a card, with the actions in its footer.',
  ),
  render: () => ({ template: `<andes-steps-card />` }),
};

export const Retry: Story = {
  name: 'A failed step with a retry',
  parameters: about(
    'A failed step keeps its error colour and progress ring, and offers a retry inside the step itself.',
  ),
  render: () => ({ template: `<andes-steps-retry />` }),
};

export const OrderTracker: Story = {
  name: 'Order tracker',
  parameters: about(
    'A stacked timeline of dots with a time beside each title and a line of detail underneath, for the history of an order.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Order history" type="dot" orientation="vertical" [current]="3" style="max-width: 28rem">
        <andes-step title="Order placed" subtitle="Mon 09:12" description="Paid with a card ending 4242" />
        <andes-step title="Packed" subtitle="Mon 15:40" description="Two boxes, 3.2 kg in total" />
        <andes-step title="Handed to the courier" subtitle="Tue 08:05" description="Tracking code PE-8841-2207" />
        <andes-step title="Out for delivery" subtitle="Wed 07:30" description="The courier is 6 stops away" />
        <andes-step title="Delivered" subtitle="Expected Wed" />
      </andes-steps>`,
  }),
};

export const ShippingTracker: Story = {
  name: 'Shipping tracker',
  parameters: about(
    'A horizontal tracker with an icon for each stage, the title below and the arrival time on the last one.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Shipping" titlePlacement="vertical" [current]="2" [percent]="65">
        <andes-step title="Ordered" icon="lucideFileText" description="Mon" />
        <andes-step title="Packed" icon="lucideBox" description="Mon" />
        <andes-step title="Shipped" icon="lucideTruck" description="65% of the route" />
        <andes-step title="Delivered" icon="lucideHouse" description="Expected Wed" />
      </andes-steps>`,
  }),
};

export const TableSmall: Story = {
  name: 'Small steps in table rows',
  parameters: about(
    'A small trail with short titles fits a table cell, and each row keeps its own current step and status.',
  ),
  render: () => ({
    template: `
      <table style="width: 100%; max-width: 46rem; border-collapse: collapse; font: 0.875rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-foreground)">
        <tbody>
          <tr style="border-bottom: 1px solid var(--andes-color-border)">
            <td style="padding: 0.75rem 1rem 0.75rem 0">Invoice 1042</td>
            <td style="padding: 0.75rem 0; width: 24rem"><andes-steps aria-label="Invoice 1042" size="small" [current]="1"><andes-step title="Draft" /><andes-step title="Sent" /><andes-step title="Paid" /></andes-steps></td>
          </tr>
          <tr style="border-bottom: 1px solid var(--andes-color-border)">
            <td style="padding: 0.75rem 1rem 0.75rem 0">Invoice 1043</td>
            <td style="padding: 0.75rem 0"><andes-steps aria-label="Invoice 1043" size="small" [current]="2"><andes-step title="Draft" /><andes-step title="Sent" /><andes-step title="Paid" /></andes-steps></td>
          </tr>
          <tr>
            <td style="padding: 0.75rem 1rem 0.75rem 0">Invoice 1044</td>
            <td style="padding: 0.75rem 0"><andes-steps aria-label="Invoice 1044" size="small" status="error" [current]="1"><andes-step title="Draft" /><andes-step title="Sent" /><andes-step title="Paid" /></andes-steps></td>
          </tr>
        </tbody>
      </table>`,
  }),
};

export const ResponsiveWizard: Story = {
  name: 'A wizard that collapses',
  parameters: about(
    'Drag the corner of the frame narrower than 480px: the trail stacks and the panel stays below it.',
  ),
  render: () => ({
    props: { stage: 1 },
    template: `
      <div style="${resizable}">
        <andes-steps aria-label="Wizard" [(current)]="stage">
          <andes-step title="Account" description="Your login" />
          <andes-step title="Profile" description="About you" />
          <andes-step title="Finish" description="All set" />
          <andes-step-panel style="display: block; padding-block: 1.5rem; font-size: 0.875rem">Content of step {{ stage + 1 }}</andes-step-panel>
          <andes-step-panel style="display: block; padding-block: 1.5rem; font-size: 0.875rem">Content of step {{ stage + 1 }}</andes-step-panel>
          <andes-step-panel style="display: block; padding-block: 1.5rem; font-size: 0.875rem">Content of step {{ stage + 1 }}</andes-step-panel>
        </andes-steps>
      </div>`,
  }),
};

export const FormProgress: Story = {
  name: 'Progress from a form',
  parameters: about(
    'The percent on the current step can come from how many fields are filled, so the ring is a live measure of the form.',
  ),
  render: () => ({
    props: { filled: 2 },
    template: `
      <andes-steps aria-label="Profile form" [current]="1" [percent]="filled * 25">
        <andes-step title="Account" />
        <andes-step title="Profile" [description]="filled + ' of 4 fields'" />
        <andes-step title="Review" />
      </andes-steps>
      <div style="display: flex; gap: 0.75rem; margin-block-start: 1.5rem">
        <andes-button variant="outline" size="sm" (click)="filled = filled > 0 ? filled - 1 : 0">Clear a field</andes-button>
        <andes-button size="sm" (click)="filled = filled < 4 ? filled + 1 : 4">Fill a field</andes-button>
      </div>`,
  }),
};

export const ProjectBoard: Story = {
  name: 'Statuses in a project list',
  parameters: about(
    'Rows of a project list each carry a trail with its own current step, a tag for the owner and an error where a stage is blocked.',
  ),
  render: () => ({
    template: `
      <div style="display: grid; gap: 1.25rem; max-width: 40rem">
        <div style="display: grid; gap: 0.5rem"><p style="margin: 0; font-weight: 600">Billing revamp</p><andes-steps aria-label="Billing revamp" size="small" type="inline" [current]="2">${FOUR}</andes-steps></div>
        <div style="display: grid; gap: 0.5rem"><p style="margin: 0; font-weight: 600">Mobile app</p><andes-steps aria-label="Mobile app" size="small" type="inline" [current]="0">${FOUR}</andes-steps></div>
        <div style="display: grid; gap: 0.5rem"><p style="margin: 0; font-weight: 600">Data export</p><andes-steps aria-label="Data export" size="small" type="inline" status="error" [current]="1">${FOUR}</andes-steps></div>
      </div>`,
  }),
};
