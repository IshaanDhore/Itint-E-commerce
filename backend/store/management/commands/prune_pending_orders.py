from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from store.models import Order

class Command(BaseCommand):
    help = "Delete pending orders older than 1 hour (or custom hours)"

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=1,
            help='Delete pending orders older than this many hours (default: 1)'
        )

    def handle(self, *args, **options):
        hours = options['hours']
        cutoff = timezone.now() - timedelta(hours=hours)
        qs = Order.objects.filter(status='pending', created_at__lt=cutoff)
        count = qs.count()
        qs.delete()
        self.stdout.write(
            self.style.SUCCESS(f"Successfully pruned {count} pending order(s) older than {hours} hour(s).")
        )
